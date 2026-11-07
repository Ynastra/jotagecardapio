import type { PanelOrder } from '@/entities/order'

export type ChannelFilter = 'all' | 'delivery' | 'pickup'

export const CHANNEL_OPTIONS: readonly { key: ChannelFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'pickup', label: 'Retirada' },
]

export type OrderFilters = {
    channel: ChannelFilter
    search: string
    periodStart: Date
}

function normalizeText(text: string): string {
    const lowered = text.toLowerCase()
    const withoutAccents = lowered.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    const normalized = withoutAccents.trim()
    return normalized
}

function matchesSearch(order: PanelOrder, rawSearch: string): boolean {
    const search = normalizeText(rawSearch).replace(/^#/, '')
    if (search === '') {
        return true
    }

    const name = normalizeText(order.customerName)
    const code = order.publicCode.toLowerCase()
    const number = String(order.number)
    const matches = name.includes(search) || code.includes(search) || number === search
    return matches
}

export function matchesFilters(order: PanelOrder, filters: OrderFilters): boolean {
    const isInPeriod = new Date(order.createdAt).getTime() >= filters.periodStart.getTime()
    const isInChannel = filters.channel === 'all' || order.fulfillment === filters.channel
    const matches = isInPeriod && isInChannel && matchesSearch(order, filters.search)
    return matches
}

export function filterOrders(orders: readonly PanelOrder[], filters: OrderFilters): PanelOrder[] {
    const filtered = orders.filter((order) => matchesFilters(order, filters))
    return filtered
}
