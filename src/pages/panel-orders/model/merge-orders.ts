import type { PanelOrder } from '@/entities/order'

// A busca pode ter lido o banco antes de uma mudança que o tempo real já
// entregou; por isso o que chegou pelo tempo real durante a busca vence.
export function mergeFetchedWithRealtime(
    fetched: readonly PanelOrder[],
    realtimeOrders: readonly PanelOrder[],
): PanelOrder[] {
    const realtimeIds = new Set(realtimeOrders.map((order) => order.id))
    const untouchedFetched = fetched.filter((order) => !realtimeIds.has(order.id))
    const merged = [...realtimeOrders, ...untouchedFetched].sort((first, second) => second.number - first.number)
    return merged
}
