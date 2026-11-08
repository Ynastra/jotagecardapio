import { getNextDayStart, getStartOfDay, getZonedDay, shiftDays } from '@/shared/lib'

export type HomePeriodKey = 'today' | 'last7' | 'last30' | 'month'

export const DEFAULT_HOME_PERIOD: HomePeriodKey = 'today'

export const HOME_PERIOD_OPTIONS: readonly { key: HomePeriodKey; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'last7', label: 'Últimos 7 dias' },
    { key: 'last30', label: 'Últimos 30 dias' },
    { key: 'month', label: 'Este mês' },
]

const DAYS_BACK: Record<'last7' | 'last30', number> = { last7: 6, last30: 29 }

export type PeriodRange = {
    start: Date
    end: Date
}

// Os dias contam com o de hoje; o fim é a próxima meia-noite da loja.
export function getHomePeriodRange(period: HomePeriodKey, now: Date, timeZone: string): PeriodRange {
    const today = getZonedDay(now, timeZone)
    const end = getNextDayStart(now, timeZone)

    switch (period) {
        case 'today':
            return { start: getStartOfDay(today, timeZone), end }
        case 'last7':
        case 'last30':
            return { start: getStartOfDay(shiftDays(today, -DAYS_BACK[period]), timeZone), end }
        case 'month':
            return { start: getStartOfDay({ ...today, day: 1 }, timeZone), end }
    }
}
