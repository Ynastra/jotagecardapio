import { formatClockTime, type PanelOrder } from '@/entities/order'

export type TimelineEntry = {
    label: string
    time: string | null
}

function formatMoment(isoTimestamp: string | null, timeZone: string): string | null {
    const time = isoTimestamp ? formatClockTime(isoTimestamp, timeZone) : null
    return time
}

// Etapas do pedido com o horário de cada uma; sem horário é etapa ainda não alcançada.
export function buildOrderTimeline(order: PanelOrder, timeZone: string): TimelineEntry[] {
    const readyLabel = order.fulfillment === 'delivery' ? 'Saiu para entrega' : 'Pronto para retirada'
    const entries = [
        { label: 'Recebido', time: formatMoment(order.createdAt, timeZone) },
        { label: 'Em preparo', time: formatMoment(order.preparingAt, timeZone) },
        { label: readyLabel, time: formatMoment(order.readyAt, timeZone) },
        { label: 'Concluído', time: formatMoment(order.completedAt, timeZone) },
    ]
    const canceledEntry = order.canceledAt ? [{ label: 'Cancelado', time: formatMoment(order.canceledAt, timeZone) }] : []
    const timeline = [...entries, ...canceledEntry]
    return timeline
}
