export type SessionState = 'connected' | 'connecting' | 'disconnected'

const SESSION_PREFIX = 'store-'
const BRAZIL_COUNTRY_CODE = '55'
const NATIONAL_LENGTHS = [10, 11]
const MIN_PHONE_DIGITS = 10
const MAX_PHONE_DIGITS = 13

const STATE_BY_GATEWAY_STATUS: Record<string, SessionState> = {
    WORKING: 'connected',
    STARTING: 'connecting',
    SCAN_QR_CODE: 'connecting',
}

export function sessionName(storeId: string): string {
    const name = `${SESSION_PREFIX}${storeId}`
    return name
}

export function mapGatewayStatus(status: string | null | undefined): SessionState {
    const state = STATE_BY_GATEWAY_STATUS[status ?? ''] ?? 'disconnected'
    return state
}

export function phoneFromGatewayId(gatewayId: string | null | undefined): string | null {
    const accountPart = (gatewayId ?? '').split('@')[0]
    const devicePart = accountPart.split(':')[0]
    const digits = devicePart.replace(/\D/g, '')
    const phone = digits === '' ? null : digits
    return phone
}

export function chatIdCandidate(customerPhone: string): string | null {
    const digits = customerPhone.replace(/\D/g, '').replace(/^0+/, '')
    if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) {
        return null
    }

    const needsCountryCode = NATIONAL_LENGTHS.includes(digits.length)
    const candidate = needsCountryCode ? `${BRAZIL_COUNTRY_CODE}${digits}` : digits
    return candidate
}
