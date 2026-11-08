import type { PanelOrder } from '@/entities/order'

function sortNewestFirst(orders: PanelOrder[]): PanelOrder[] {
    const sorted = orders.sort((first, second) => second.number - first.number)
    return sorted
}

// A busca pode ter lido o banco antes de uma mudança que o tempo real já
// entregou; por isso o que chegou pelo tempo real durante a busca vence, e o
// pedido que saiu da lista durante a busca não volta com o estado antigo.
export function mergeFetchedWithRealtime(
    fetched: readonly PanelOrder[],
    realtimeOrders: readonly PanelOrder[],
    removedIds: ReadonlySet<string> = new Set(),
): PanelOrder[] {
    const realtimeIds = new Set(realtimeOrders.map((order) => order.id))
    const untouchedFetched = fetched.filter((order) => !realtimeIds.has(order.id) && !removedIds.has(order.id))
    const merged = sortNewestFirst([...realtimeOrders, ...untouchedFetched])
    return merged
}

// O pedido aberto na gaveta não some da lista por uma junção: a gaveta
// precisa dele para continuar mostrando o mesmo pedido.
export function keepPinnedOrder(
    merged: readonly PanelOrder[],
    previous: readonly PanelOrder[],
    pinnedOrderId: string | null,
): PanelOrder[] {
    const pinned = pinnedOrderId ? previous.find((order) => order.id === pinnedOrderId) : undefined
    if (!pinned || merged.some((order) => order.id === pinned.id)) {
        return [...merged]
    }

    const kept = sortNewestFirst([...merged, pinned])
    return kept
}
