import type { PanelOrder } from '@/entities/order'

import { isActiveOrder } from './order-flow'

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

// Pedido em andamento aparece em qualquer período; o período filtra só os
// concluídos e cancelados, pela data de criação.
export function isVisibleInPeriod(order: PanelOrder, periodStart: Date): boolean {
    const isCreatedInPeriod = new Date(order.createdAt).getTime() >= periodStart.getTime()
    const isVisible = isActiveOrder(order) || isCreatedInPeriod
    return isVisible
}

export function matchesFilters(order: PanelOrder, filters: OrderFilters): boolean {
    const isInPeriod = isVisibleInPeriod(order, filters.periodStart)
    const isInChannel = filters.channel === 'all' || order.fulfillment === filters.channel
    const matches = isInPeriod && isInChannel && matchesSearch(order, filters.search)
    return matches
}

export function filterOrders(orders: readonly PanelOrder[], filters: OrderFilters): PanelOrder[] {
    const filtered = orders.filter((order) => matchesFilters(order, filters))
    return filtered
}
