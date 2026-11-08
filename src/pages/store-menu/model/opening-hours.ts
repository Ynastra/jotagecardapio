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

export type StoreStatus = {
    isOpen: boolean
    label: string
}

function findNextOpening(hours: readonly StoreHours[], clock: LocalClock): { dayOffset: number; opensAt: string } | null {
    // O offset DAYS_PER_WEEK cobre a loja que só abre de novo no mesmo dia da semana seguinte.
    for (let dayOffset = 0; dayOffset <= DAYS_PER_WEEK; dayOffset += 1) {
        const weekday = (clock.weekday + dayOffset) % DAYS_PER_WEEK
        const upcoming = hours
            .filter((range) => range.weekday === weekday)
            .filter((range) => dayOffset > 0 || toMinutes(range.opensAt) > clock.minutes)
            .sort((first, second) => toMinutes(first.opensAt) - toMinutes(second.opensAt))

        if (upcoming.length > 0) {
            return { dayOffset, opensAt: upcoming[0].opensAt }
        }
    }

    return null
}

export function describeStoreStatus(
    hours: readonly StoreHours[],
    enforceOpeningHours: boolean,
    clock: LocalClock,
): StoreStatus {
    if (!enforceOpeningHours) {
        const alwaysOpen = { isOpen: true, label: 'Aberto' }
        return alwaysOpen
    }

    const openRange = hours.find((range) => isWithinRange(range, clock))
    if (openRange) {
        const open = { isOpen: true, label: `Aberto até ${formatTime(openRange.closesAt)}` }
        return open
    }

    const next = findNextOpening(hours, clock)
    if (!next) {
        const closed = { isOpen: false, label: 'Fechado' }
        return closed
    }

    const weekday = (clock.weekday + next.dayOffset) % DAYS_PER_WEEK
    const dayLabel = next.dayOffset === 0 ? 'hoje' : WEEKDAY_NAMES[weekday].toLowerCase()
    const closed = { isOpen: false, label: `Fechado, abre ${dayLabel} às ${formatTime(next.opensAt)}` }
    return closed
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
