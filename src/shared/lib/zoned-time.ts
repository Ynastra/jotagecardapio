const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const MONTHS_PER_YEAR = 12

export type CalendarDay = {
    year: number
    month: number
    day: number
}

function readZonedParts(instant: Date, timeZone: string): Record<string, string> {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'short',
    })
    const parts: Record<string, string> = {}
    for (const part of formatter.formatToParts(instant)) {
        parts[part.type] = part.value
    }
    return parts
}

export function getZonedDay(instant: Date, timeZone: string): CalendarDay {
    const parts = readZonedParts(instant, timeZone)
    const day = { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) }
    return day
}

// Dia da semana no fuso, de 0 (domingo) a 6 (sábado).
export function getZonedWeekday(instant: Date, timeZone: string): number {
    const parts = readZonedParts(instant, timeZone)
    const weekday = WEEKDAY_INDEX[parts.weekday]
    return weekday
}

function getZoneOffsetMs(instant: Date, timeZone: string): number {
    const parts = readZonedParts(instant, timeZone)
    const wallClockAsUtc = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
    )
    const offset = wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000
    return offset
}

// Instante em que o dia `day` começa (00:00) no fuso.
export function getStartOfDay(day: CalendarDay, timeZone: string): Date {
    const wallClockAsUtc = Date.UTC(day.year, day.month - 1, day.day)
    const firstGuess = new Date(wallClockAsUtc - getZoneOffsetMs(new Date(wallClockAsUtc), timeZone))
    const refined = new Date(wallClockAsUtc - getZoneOffsetMs(firstGuess, timeZone))
    return refined
}

export function shiftDays(day: CalendarDay, days: number): CalendarDay {
    const shifted = new Date(Date.UTC(day.year, day.month - 1, day.day + days))
    const result = { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() }
    return result
}

// Recua `months` meses; o dia é limitado ao último dia do mês de destino.
export function shiftMonths(day: CalendarDay, months: number): CalendarDay {
    const monthIndex = day.year * MONTHS_PER_YEAR + (day.month - 1) - months
    const year = Math.floor(monthIndex / MONTHS_PER_YEAR)
    const month = (monthIndex % MONTHS_PER_YEAR) + 1
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const result = { year, month, day: Math.min(day.day, lastDayOfMonth) }
    return result
}

// Próxima meia-noite no fuso, quando "hoje" vira outro dia.
export function getNextDayStart(now: Date, timeZone: string): Date {
    const tomorrow = shiftDays(getZonedDay(now, timeZone), 1)
    const nextDayStart = getStartOfDay(tomorrow, timeZone)
    return nextDayStart
}
