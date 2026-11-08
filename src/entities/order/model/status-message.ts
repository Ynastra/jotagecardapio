import type { Fulfillment, OrderStatus, PanelOrder } from './types'

export type StatusMessageType = 'confirmed' | 'preparing' | 'out_for_delivery' | 'ready_for_pickup' | 'completed' | 'canceled'

// Texto próprio da loja (`customBody`) vence o padrão; `isActive` falso
// desliga o aviso daquele status.
export type StoredStatusMessage = {
    type: string
    isActive: boolean
    customBody: string | null
}

export type StatusMessageContext = {
    storeName: string
    trackingUrl: string
    stored: readonly StoredStatusMessage[]
}

export const DEFAULT_STATUS_MESSAGES: Record<StatusMessageType, string> = {
    confirmed: 'Olá, {nome}! Seu pedido foi confirmado! Por aqui você receberá todas as atualizações. Link do pedido: {link}',
    preparing: 'Seu pedido está sendo preparado! {link}',
    out_for_delivery: 'Seu pedido saiu para entrega! {link}',
    ready_for_pickup: 'Seu pedido está pronto para retirada! {link}',
    completed: '{loja} agradece sua preferência!',
    canceled: 'Seu pedido {codigo} foi cancelado. Se tiver dúvida, é só responder esta mensagem.',
}

export function getStatusMessageType(status: OrderStatus, fulfillment: Fulfillment): StatusMessageType {
    switch (status) {
        case 'received':
            return 'confirmed'
        case 'preparing':
            return 'preparing'
        case 'ready': {
            const readyType = fulfillment === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
            return readyType
        }
        case 'completed':
            return 'completed'
        case 'canceled':
            return 'canceled'
    }
}

function getFirstName(fullName: string): string {
    const trimmedName = fullName.trim()
    const [firstName] = trimmedName.split(/\s+/)
    return firstName
}

export function fillPlaceholders(template: string, values: Record<string, string>): string {
    const filled = template.replace(/\{(\w+)\}/g, (placeholder, key: string) => values[key] ?? placeholder)
    return filled
}

// Devolve null quando a loja desligou o aviso do status do pedido.
export function buildStatusMessage(order: PanelOrder, context: StatusMessageContext): string | null {
    const type = getStatusMessageType(order.status, order.fulfillment)
    const stored = context.stored.find((message) => message.type === type)
    if (stored && !stored.isActive) {
        return null
    }

    const customBody = stored?.customBody?.trim()
    const template = customBody ? customBody : DEFAULT_STATUS_MESSAGES[type]
    const message = fillPlaceholders(template, {
        nome: getFirstName(order.customerName),
        loja: context.storeName,
        codigo: order.publicCode,
        link: context.trackingUrl,
    })
    return message
}
