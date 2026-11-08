import { formatBrazilianPhone, keepDigits } from '@/shared/lib'

export type ConnectionState = 'connected' | 'connecting' | 'disconnected'

export type StoredSession = {
    state: ConnectionState
    phone: string | null
    updatedAt: string
}

export type GatewaySnapshot = {
    state: ConnectionState
    phone: string | null
    qr: string | null
}

export type ConnectionView = {
    state: ConnectionState
    label: string
    phoneText: string | null
    updatedAtText: string | null
}

export const CONNECTION_LABELS: Record<ConnectionState, string> = {
    connected: 'Conectado',
    connecting: 'Conectando',
    disconnected: 'Desconectado',
}

const BRAZIL_COUNTRY_CODE = '55'
const MIN_INTERNATIONAL_DIGITS = 12

export function formatSessionPhone(phone: string): string {
    const digits = keepDigits(phone)
    const isBrazilian = digits.length >= MIN_INTERNATIONAL_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE)
    if (!isBrazilian) {
        return digits === '' ? '' : `+${digits}`
    }

    const national = formatBrazilianPhone(digits.slice(BRAZIL_COUNTRY_CODE.length))
    const formatted = `+${BRAZIL_COUNTRY_CODE} ${national}`
    return formatted
}

export function formatUpdatedAt(isoTimestamp: string, timeZone: string): string {
    const instant = new Date(isoTimestamp)
    const date = new Intl.DateTimeFormat('pt-BR', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(
        instant,
    )
    const time = new Intl.DateTimeFormat('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(
        instant,
    )
    const text = `${date} às ${time}`
    return text
}

export function sessionFromSnapshot(snapshot: GatewaySnapshot, updatedAt: string): StoredSession {
    const session = { state: snapshot.state, phone: snapshot.phone, updatedAt }
    return session
}

export function shouldPollSession(state: ConnectionState): boolean {
    const shouldPoll = state === 'connecting'
    return shouldPoll
}

export function qrImageSource(qr: string | null): string | null {
    const source = qr ? `data:image/png;base64,${qr}` : null
    return source
}

export function describeConnection(session: StoredSession | null, timeZone: string): ConnectionView {
    const state = session?.state ?? 'disconnected'
    const label = CONNECTION_LABELS[state]
    if (!session || state !== 'connected') {
        return { state, label, phoneText: null, updatedAtText: null }
    }

    const phoneText = session.phone ? formatSessionPhone(session.phone) : null
    const updatedAtText = formatUpdatedAt(session.updatedAt, timeZone)
    return { state, label, phoneText, updatedAtText }
}
