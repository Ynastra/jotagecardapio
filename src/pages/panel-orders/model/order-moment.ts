import { formatClockTime } from '@/entities/order'

function formatDate(instant: Date, timeZone: string, withYear: boolean): string {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        ...(withYear ? { year: 'numeric' } : {}),
        timeZone,
    })
    const date = formatter.format(instant)
    return date
}

// Data completa e hora, no fuso da loja: 07/11/2026 19:05.
export function formatOrderDateTime(isoTimestamp: string, timeZone: string): string {
    const date = formatDate(new Date(isoTimestamp), timeZone, true)
    const time = formatClockTime(isoTimestamp, timeZone)
    const dateTime = `${date} ${time}`
    return dateTime
}

// Hora do pedido; acrescenta a data quando ele não é de hoje na loja.
export function describeOrderMoment(createdAtIso: string, now: Date, timeZone: string): string {
    const createdAt = new Date(createdAtIso)
    const time = formatClockTime(createdAtIso, timeZone)
    const isToday = formatDate(createdAt, timeZone, true) === formatDate(now, timeZone, true)
    const moment = isToday ? time : `${formatDate(createdAt, timeZone, false)} ${time}`
    return moment
}
