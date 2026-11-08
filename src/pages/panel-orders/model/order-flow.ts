import type { Fulfillment, OrderStatus, PanelOrder } from '@/entities/order'

export type StatusStep = {
    next: OrderStatus
    label: string
}

const ACTIVE_STATUSES: readonly OrderStatus[] = ['received', 'preparing', 'ready']

export function getNextStep(status: OrderStatus, fulfillment: Fulfillment): StatusStep | null {
    switch (status) {
        case 'received': {
            const startPreparing = { next: 'preparing' as const, label: 'Começar preparo' }
            return startPreparing
        }
        case 'preparing': {
            const label = fulfillment === 'delivery' ? 'Saiu para entrega' : 'Pronto para retirar'
            const markReady = { next: 'ready' as const, label }
            return markReady
        }
        case 'ready': {
            const complete = { next: 'completed' as const, label: 'Concluir' }
            return complete
        }
        case 'completed':
        case 'canceled': {
            const finished = null
            return finished
        }
    }
}

// Etapa anterior do fluxo; o pedido novo e o cancelado não voltam.
export function getPreviousStatus(status: OrderStatus): OrderStatus | null {
    switch (status) {
        case 'preparing':
            return 'received'
        case 'ready':
            return 'preparing'
        case 'completed':
            return 'ready'
        case 'received':
        case 'canceled':
            return null
    }
}

export function isActiveOrder(order: PanelOrder): boolean {
    const isActive = ACTIVE_STATUSES.includes(order.status)
    return isActive
}

// Mantém a lista ordenada do mais novo para o mais antigo ao receber uma
// atualização em tempo real (pedido novo ou mudança de status).
export function upsertOrder(orders: readonly PanelOrder[], incoming: PanelOrder): PanelOrder[] {
    const withoutIncoming = orders.filter((order) => order.id !== incoming.id)
    const merged = [incoming, ...withoutIncoming].sort((first, second) => second.number - first.number)
    return merged
}
