import type { Fulfillment, OrderStatus, PaymentMethod } from './types'

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
    pix: 'Pix',
    cash: 'Dinheiro',
    credit: 'Crédito',
    debit: 'Débito',
}

export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
    delivery: 'Entrega',
    pickup: 'Retirar na loja',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
    received: 'Recebido',
    preparing: 'Em preparo',
    ready: 'Pronto',
    completed: 'Concluído',
    canceled: 'Cancelado',
}

export function getStatusLabel(status: OrderStatus, fulfillment: Fulfillment): string {
    const isOutForDelivery = status === 'ready' && fulfillment === 'delivery'
    const label = isOutForDelivery ? 'Saiu para entrega' : STATUS_LABELS[status]
    return label
}
