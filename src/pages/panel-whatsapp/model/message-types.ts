import { DEFAULT_STATUS_MESSAGES, type StatusMessageType } from '@/entities/order'

export type WhatsappMessageType = 'greeting' | 'away' | StatusMessageType

export const BODY_MAX = 1000
export const INTERVAL_MIN_HOURS = 1
export const INTERVAL_MAX_HOURS = 168
export const DEFAULT_INTERVAL_HOURS = 24
export const MINUTES_PER_HOUR = 60

export const MESSAGE_TYPES: readonly WhatsappMessageType[] = [
    'greeting',
    'away',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'ready_for_pickup',
    'completed',
    'canceled',
]

export const MESSAGE_TITLES: Record<WhatsappMessageType, string> = {
    greeting: 'Saudação',
    away: 'Ausência',
    confirmed: 'Confirmação',
    preparing: 'Em preparo',
    out_for_delivery: 'Saiu para entrega',
    ready_for_pickup: 'Pronto para retirada',
    completed: 'Finalizado',
    canceled: 'Cancelado',
}

export const MESSAGE_TIMINGS: Record<WhatsappMessageType, string> = {
    greeting: 'Enviada quando o cliente escreve para a loja pela primeira vez no intervalo.',
    away: 'Enviada quando o cliente escreve com a loja fechada.',
    confirmed: 'Enviada quando o pedido é confirmado.',
    preparing: 'Enviada quando o pedido entra em preparo.',
    out_for_delivery: 'Enviada quando o pedido de entrega sai da loja.',
    ready_for_pickup: 'Enviada quando o pedido de retirada fica pronto.',
    completed: 'Enviada quando o pedido é finalizado.',
    canceled: 'Enviada quando o pedido é cancelado.',
}

const STORE_VARIABLES = ['loja', 'cardapio'] as const
const ORDER_VARIABLES = ['nome', 'loja', 'codigo', 'link'] as const

export const VARIABLES_BY_TYPE: Record<WhatsappMessageType, readonly string[]> = {
    greeting: STORE_VARIABLES,
    away: STORE_VARIABLES,
    confirmed: ORDER_VARIABLES,
    preparing: ORDER_VARIABLES,
    out_for_delivery: ORDER_VARIABLES,
    ready_for_pickup: ORDER_VARIABLES,
    completed: ORDER_VARIABLES,
    canceled: ORDER_VARIABLES,
}

export const DEFAULT_MESSAGES: Record<WhatsappMessageType, string> = {
    greeting: 'Boas-vindas à {loja}! Acesse nosso cardápio e faça seu pedido: {cardapio}',
    away: 'Olá! Estamos fechados no momento. Confira nossos horários e o cardápio: {cardapio}',
    ...DEFAULT_STATUS_MESSAGES,
}
