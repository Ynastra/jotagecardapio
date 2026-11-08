import { supabase } from '@/shared/api'

import type { ConnectionState, GatewaySnapshot, StoredSession } from '../model/connection'

type SessionAction = 'status' | 'connect' | 'disconnect'

type SessionDbRow = {
    state: ConnectionState
    phone: string | null
    updated_at: string
}

export async function runSessionAction(action: SessionAction, storeId: string): Promise<GatewaySnapshot> {
    const { data, error } = await supabase.functions.invoke<GatewaySnapshot>('whatsapp', {
        body: { action, store_id: storeId },
    })

    if (error || !data) {
        throw error ?? new Error('Resposta vazia da função whatsapp')
    }

    return data
}

export async function fetchSession(storeId: string): Promise<StoredSession | null> {
    const { data, error } = await supabase
        .from('store_whatsapp_sessions')
        .select('state, phone, updated_at')
        .eq('store_id', storeId)
        .maybeSingle()

    if (error) {
        throw error
    }

    const row = data as SessionDbRow | null
    const session = row ? { state: row.state, phone: row.phone, updatedAt: row.updated_at } : null
    return session
}
