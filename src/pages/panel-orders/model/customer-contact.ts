import { buildWhatsappUrl, type PanelOrder } from '@/entities/order'
import { keepDigits } from '@/shared/lib'

const BRAZIL_COUNTRY_CODE = '55'
const MAX_NATIONAL_DIGITS = 11

function toInternationalDigits(phone: string): string {
    const digits = keepDigits(phone)
    const isNational = digits.length <= MAX_NATIONAL_DIGITS
    const international = isNational ? `${BRAZIL_COUNTRY_CODE}${digits}` : digits
    return international
}

export function buildTrackingUrl(origin: string, storeSlug: string, order: PanelOrder): string {
    const url = `${origin}/${storeSlug}/pedido/${order.trackingToken}`
    return url
}

export function buildCustomerWhatsappUrl(order: PanelOrder, message: string): string {
    const url = buildWhatsappUrl(toInternationalDigits(order.customerPhone), message)
    return url
}
