import { getStartOfDay, getZonedDay, getZonedWeekday, shiftDays, shiftMonths } from '@/shared/lib'

export type PeriodKey ='today' | 'week' | 'month' | 'quarter'

export const PERIOD_OPTIONS: readonly { key: PeriodKey; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Nesta semana' },
    { key: 'month', label: 'Neste mês' },
    { key: 'quarter', label: 'Últimos 3 meses' },
]

const QUARTER_MONTHS = 3
const DAYS_PER_WEEK = 7
const MONDAY_WEEKDAY = 1

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
