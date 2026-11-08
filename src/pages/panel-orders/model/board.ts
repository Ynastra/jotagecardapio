import type { PanelOrder } from '@/entities/order'

export const ORDERS_QUERY_LIMIT = 500

export type BoardColumns = {
    received: PanelOrder[]
    preparing: PanelOrder[]
    ready: PanelOrder[]
    finished: PanelOrder[]
}

export function groupOrdersIntoColumns(orders: readonly PanelOrder[]): BoardColumns {
    const columns: BoardColumns = {
        received: orders.filter((order) => order.status === 'received'),
        preparing: orders.filter((order) => order.status === 'preparing'),
        ready: orders.filter((order) => order.status === 'ready'),
        finished: orders.filter((order) => order.status === 'completed' || order.status === 'canceled'),
    }
    return columns
}

export function sumCompletedCents(orders: readonly PanelOrder[]): number {
    const completedOrders = orders.filter((order) => order.status === 'completed')
    const total = completedOrders.reduce((sum, order) => sum + order.totalCents, 0)
    return total
}

export function hasReachedQueryLimit(loadedCount: number): boolean {
    const hasReached = loadedCount >= ORDERS_QUERY_LIMIT
    return hasReached
}
