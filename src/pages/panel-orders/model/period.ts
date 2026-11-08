export type PeriodKey = 'today' | 'week' | 'month' | 'quarter'

export const PERIOD_OPTIONS: readonly { key: PeriodKey; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Nesta semana' },
    { key: 'month', label: 'Neste mês' },
    { key: 'quarter', label: 'Últimos 3 meses' },
]

const QUARTER_MONTHS = 3
const DAYS_PER_WEEK = 7
const MONDAY_WEEKDAY = 1

type CalendarDay = {
    year: number
    month: number
    day: number
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

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

function getZonedDay(instant: Date, timeZone: string): CalendarDay {
    const parts = readZonedParts(instant, timeZone)
    const day = { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) }
    return day
}

function getZonedWeekday(instant: Date, timeZone: string): number {
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

// Instante em que o dia `day` começa (00:00) no fuso da loja.
function getStartOfDay(day: CalendarDay, timeZone: string): Date {
    const wallClockAsUtc = Date.UTC(day.year, day.month - 1, day.day)
    const firstGuess = new Date(wallClockAsUtc - getZoneOffsetMs(new Date(wallClockAsUtc), timeZone))
    const refined = new Date(wallClockAsUtc - getZoneOffsetMs(firstGuess, timeZone))
    return refined
}

function shiftDays(day: CalendarDay, days: number): CalendarDay {
    const shifted = new Date(Date.UTC(day.year, day.month - 1, day.day + days))
    const result = { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() }
    return result
}

function shiftMonths(day: CalendarDay, months: number): CalendarDay {
    const monthIndex = day.year * 12 + (day.month - 1) - months
    const year = Math.floor(monthIndex / 12)
    const month = (monthIndex % 12) + 1
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const result = { year, month, day: Math.min(day.day, lastDayOfMonth) }
    return result
}

// Próxima meia-noite no fuso da loja, quando "hoje" vira outro dia.
export function getNextDayStart(now: Date, timeZone: string): Date {
    const tomorrow = shiftDays(getZonedDay(now, timeZone), 1)
    const nextDayStart = getStartOfDay(tomorrow, timeZone)
    return nextDayStart
}

// Primeiro instante do período, no fuso da loja. A semana começa na segunda.
export function getPeriodStart(period: PeriodKey, now: Date, timeZone: string): Date {
    const today = getZonedDay(now, timeZone)

    switch (period) {
        case 'today':
            return getStartOfDay(today, timeZone)
        case 'week': {
            const weekday = getZonedWeekday(now, timeZone)
            const daysSinceMonday = (weekday - MONDAY_WEEKDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK
            const monday = shiftDays(today, -daysSinceMonday)
            return getStartOfDay(monday, timeZone)
        }
        case 'month': {
            const firstOfMonth = { ...today, day: 1 }
            return getStartOfDay(firstOfMonth, timeZone)
        }
        case 'quarter': {
            const threeMonthsAgo = shiftMonths(today, QUARTER_MONTHS)
            return getStartOfDay(threeMonthsAgo, timeZone)
        }
    }
}
