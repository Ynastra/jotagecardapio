import type { Fulfillment } from './types'

const MS_PER_MINUTE = 60_000

const DEADLINE_PREFIXES: Record<Fulfillment, string> = {
    delivery: 'Entrega até',
    pickup: 'Retirada até',
}

export function formatClockTime(isoTimestamp: string, timezone: string): string {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: timezone,
    })
    const time = formatter.format(new Date(isoTimestamp))
    return time
}

// O prazo é o horário do pedido mais o preparo, lido no fuso da loja.
export function describeOrderDeadline(
    createdAtIso: string,
    prepTimeMinutes: number,
    timezone: string,
    fulfillment: Fulfillment,
): string {
    const readyAt = new Date(new Date(createdAtIso).getTime() + prepTimeMinutes * MS_PER_MINUTE)
    const time = formatClockTime(readyAt.toISOString(), timezone)
    const description = `${DEADLINE_PREFIXES[fulfillment]} ${time}`
    return description
}
