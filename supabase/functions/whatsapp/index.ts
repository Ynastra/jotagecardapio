import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

import {
    chatIdCandidate,
    mapGatewayStatus,
    phoneFromGatewayId,
    sessionName,
    type SessionState,
} from './session-logic.ts'

type ErrorCode = 'invalid_request' | 'not_member' | 'not_connected' | 'not_on_whatsapp' | 'gateway_unavailable'

type GatewaySession = {
    status?: string
    me?: { id?: string }
}

type SessionSnapshot = {
    state: SessionState
    phone: string | null
    qr: string | null
}

type RequestBody = {
    action?: string
    store_id?: string
    order_id?: string
    text?: string
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const STATUS_BY_ERROR: Record<ErrorCode, number> = {
    invalid_request: 400,
    not_member: 403,
    not_connected: 409,
    not_on_whatsapp: 422,
    gateway_unavailable: 502,
}

const MAX_TEXT_LENGTH = 2000
const GATEWAY_TIMEOUT_MS = 15000
const QR_WAIT_ATTEMPTS = 6
const QR_WAIT_INTERVAL_MS = 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class FunctionError extends Error {
    constructor(readonly code: ErrorCode) {
        super(code)
    }
}

function jsonResponse(body: unknown, status: number): Response {
    const response = new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
    return response
}

async function gatewayFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const baseUrl = Deno.env.get('WAHA_URL') ?? ''
    const apiKey = Deno.env.get('WAHA_API_KEY') ?? ''
    const headers = { ...init.headers, 'X-Api-Key': apiKey, Accept: 'application/json' }

    try {
        const response = await fetch(`${baseUrl}${path}`, {
            ...init,
            headers,
            signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
        })
        return response
    } catch {
        throw new FunctionError('gateway_unavailable')
    }
}

async function gatewayJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const jsonInit = { ...init, headers: { ...init.headers, 'Content-Type': 'application/json' } }
    const response = await gatewayFetch(path, jsonInit)
    if (!response.ok) {
        throw new FunctionError('gateway_unavailable')
    }

    const payload = (await response.json()) as T
    return payload
}

async function readGatewaySession(name: string): Promise<GatewaySession | null> {
    const response = await gatewayFetch(`/api/sessions/${name}`)
    if (response.status === 404) {
        return null
    }
    if (!response.ok) {
        throw new FunctionError('gateway_unavailable')
    }

    const session = (await response.json()) as GatewaySession
    return session
}

async function readQrCode(name: string): Promise<string | null> {
    const response = await gatewayFetch(`/api/${name}/auth/qr`)
    if (!response.ok) {
        return null
    }

    const payload = (await response.json()) as { data?: string }
    const qr = payload.data ?? null
    return qr
}

async function snapshotSession(name: string): Promise<SessionSnapshot> {
    const session = await readGatewaySession(name)
    const state = mapGatewayStatus(session?.status)
    const phone = state === 'connected' ? phoneFromGatewayId(session?.me?.id) : null
    const isWaitingForScan = session?.status === 'SCAN_QR_CODE'
    const qr = isWaitingForScan ? await readQrCode(name) : null
    return { state, phone, qr }
}

async function saveSession(admin: SupabaseClient, storeId: string, snapshot: SessionSnapshot): Promise<void> {
    const { error } = await admin.from('store_whatsapp_sessions').upsert({
        store_id: storeId,
        provider: 'qr',
        state: snapshot.state,
        phone: snapshot.phone,
        updated_at: new Date().toISOString(),
    })
    if (error) {
        throw error
    }
}

async function syncSession(admin: SupabaseClient, storeId: string): Promise<SessionSnapshot> {
    const snapshot = await snapshotSession(sessionName(storeId))
    await saveSession(admin, storeId, snapshot)
    return snapshot
}

async function ensureSessionStarted(name: string): Promise<void> {
    const session = await readGatewaySession(name)
    if (!session) {
        await gatewayJson('/api/sessions', { method: 'POST', body: JSON.stringify({ name, start: true }) })
        return
    }

    if (session.status === 'STOPPED') {
        await gatewayJson(`/api/sessions/${name}/start`, { method: 'POST' })
    } else if (session.status === 'FAILED') {
        await gatewayJson(`/api/sessions/${name}/restart`, { method: 'POST' })
    }
}

async function connect(admin: SupabaseClient, storeId: string): Promise<SessionSnapshot> {
    await ensureSessionStarted(sessionName(storeId))

    let snapshot = await syncSession(admin, storeId)
    for (let attempt = 0; attempt < QR_WAIT_ATTEMPTS && snapshot.state === 'connecting' && !snapshot.qr; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, QR_WAIT_INTERVAL_MS))
        snapshot = await syncSession(admin, storeId)
    }
    return snapshot
}

async function disconnect(admin: SupabaseClient, storeId: string): Promise<SessionSnapshot> {
    const name = sessionName(storeId)
    const session = await readGatewaySession(name)
    if (session) {
        await gatewayJson(`/api/sessions/${name}/logout`, { method: 'POST' })
    }

    const snapshot: SessionSnapshot = { state: 'disconnected', phone: null, qr: null }
    await saveSession(admin, storeId, snapshot)
    return snapshot
}

async function resolveChatId(name: string, customerPhone: string): Promise<string> {
    const candidate = chatIdCandidate(customerPhone)
    if (!candidate) {
        throw new FunctionError('not_on_whatsapp')
    }

    const query = new URLSearchParams({ phone: candidate, session: name })
    const lookup = await gatewayJson<{ numberExists?: boolean; chatId?: string }>(
        `/api/contacts/check-exists?${query.toString()}`,
    )
    if (!lookup.numberExists || !lookup.chatId) {
        throw new FunctionError('not_on_whatsapp')
    }

    return lookup.chatId
}

async function sendOrderMessage(userClient: SupabaseClient, storeId: string, body: RequestBody): Promise<void> {
    const orderId = body.order_id ?? ''
    const text = (body.text ?? '').trim()
    if (!UUID_PATTERN.test(orderId) || text === '' || text.length > MAX_TEXT_LENGTH) {
        throw new FunctionError('invalid_request')
    }

    const { data: order, error } = await userClient
        .from('orders')
        .select('customer_phone')
        .eq('id', orderId)
        .eq('store_id', storeId)
        .maybeSingle()
    if (error) {
        throw error
    }
    if (!order) {
        throw new FunctionError('not_member')
    }

    const name = sessionName(storeId)
    const session = await readGatewaySession(name)
    if (session?.status !== 'WORKING') {
        throw new FunctionError('not_connected')
    }

    const chatId = await resolveChatId(name, order.customer_phone as string)
    await gatewayJson('/api/sendText', { method: 'POST', body: JSON.stringify({ session: name, chatId, text }) })
}

async function assertStoreMember(userClient: SupabaseClient, storeId: string): Promise<void> {
    const { data, error } = await userClient.rpc('is_store_member', { target_store: storeId })
    if (error || data !== true) {
        throw new FunctionError('not_member')
    }
}

async function handleAction(request: Request, body: RequestBody): Promise<unknown> {
    const storeId = body.store_id ?? ''
    if (!UUID_PATTERN.test(storeId)) {
        throw new FunctionError('invalid_request')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
        global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
    })
    await assertStoreMember(userClient, storeId)

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    switch (body.action) {
        case 'status':
            return await syncSession(admin, storeId)
        case 'connect':
            return await connect(admin, storeId)
        case 'disconnect':
            return await disconnect(admin, storeId)
        case 'send':
            await sendOrderMessage(userClient, storeId, body)
            return { sent: true }
        default:
            throw new FunctionError('invalid_request')
    }
}

async function handleRequest(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: CORS_HEADERS })
    }

    try {
        const body = (await request.json()) as RequestBody
        const result = await handleAction(request, body)
        const response = jsonResponse(result, 200)
        return response
    } catch (error) {
        if (error instanceof FunctionError) {
            const response = jsonResponse({ error: error.code }, STATUS_BY_ERROR[error.code])
            return response
        }

        if (error instanceof SyntaxError) {
            const response = jsonResponse({ error: 'invalid_request' }, STATUS_BY_ERROR.invalid_request)
            return response
        }

        console.error('Falha na função whatsapp', error instanceof Error ? error.message : 'erro desconhecido')
        const response = jsonResponse({ error: 'internal_error' }, 500)
        return response
    }
}

Deno.serve(handleRequest)
