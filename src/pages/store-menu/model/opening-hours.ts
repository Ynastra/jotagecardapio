import type { Store, StoreHours } from './types'

const MINUTES_PER_HOUR = 60
const DAYS_PER_WEEK = 7
const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
// A semana do comércio começa na segunda; domingo fecha a lista.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const SHORT_WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export type LocalClock = {
    weekday: number
    minutes: number
}

export type DaySchedule = {
    weekday: number
    name: string
    ranges: string[]
}

// Hora da loja, não do aparelho: quem abre o link de outro fuso vê o status certo.
export function getLocalClock(date: Date, timeZone: string): LocalClock {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date)
    const partValue = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
    const hours = Number(partValue('hour'))
    const minutes = Number(partValue('minute'))

    const clock = { weekday: SHORT_WEEKDAY_INDEX[partValue('weekday')], minutes: hours * MINUTES_PER_HOUR + minutes }
    return clock
}

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    const total = hours * MINUTES_PER_HOUR + minutes
    return total
}

function isWithinRange(range: StoreHours, clock: LocalClock): boolean {
    const opens = toMinutes(range.opensAt)
    const closes = toMinutes(range.closesAt)
    const previousWeekday = (clock.weekday + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK

    if (opens < closes) {
        const isSameDayOpen = range.weekday === clock.weekday && clock.minutes >= opens && clock.minutes < closes
        return isSameDayOpen
    }

    // Expediente que passa da meia-noite: vale o fim do dia de abertura e o
    // começo do dia seguinte.
    const isLateOnOpeningDay = range.weekday === clock.weekday && clock.minutes >= opens
    const isEarlyNextDay = range.weekday === previousWeekday && clock.minutes < closes
    const isOvernightOpen = isLateOnOpeningDay || isEarlyNextDay
    return isOvernightOpen
}

export function isOpenAt(hours: readonly StoreHours[], clock: LocalClock): boolean {
    const isOpen = hours.some((range) => isWithinRange(range, clock))
    return isOpen
}

export function isStoreOpenNow(store: Store, now: Date = new Date()): boolean {
    if (!store.enforceOpeningHours) {
        return true
    }

    const isOpen = isOpenAt(store.hours, getLocalClock(now, store.timezone))
    return isOpen
}

export function formatTime(time: string): string {
    const formatted = time.slice(0, 5)
    return formatted
}

export function describeWeek(hours: readonly StoreHours[]): DaySchedule[] {
    const week = DISPLAY_ORDER.map((weekday) => ({
        weekday,
        name: WEEKDAY_NAMES[weekday],
        ranges: hours
            .filter((range) => range.weekday === weekday)
            .sort((first, second) => toMinutes(first.opensAt) - toMinutes(second.opensAt))
            .map((range) => `${formatTime(range.opensAt)} às ${formatTime(range.closesAt)}`),
    }))
    return week
}
