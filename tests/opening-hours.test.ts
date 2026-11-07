import { describe, expect, it } from 'vitest'

import { describeWeek, getLocalClock, isOpenAt } from '@/pages/store-menu/model/opening-hours'
import type { StoreHours } from '@/pages/store-menu/model/types'

const MINUTES_PER_HOUR = 60

const evenings: StoreHours[] = [
    { weekday: 1, opensAt: '18:30:00', closesAt: '22:00:00' },
    { weekday: 5, opensAt: '18:30:00', closesAt: '02:00:00' },
]

function at(weekday: number, hours: number, minutes = 0) {
    const clock = { weekday, minutes: hours * MINUTES_PER_HOUR + minutes }
    return clock
}

describe('isOpenAt', () => {
    it('abre no horário e fecha no minuto exato do fechamento', () => {
        expect(isOpenAt(evenings, at(1, 18, 29))).toBe(false)
        expect(isOpenAt(evenings, at(1, 18, 30))).toBe(true)
        expect(isOpenAt(evenings, at(1, 22, 0))).toBe(false)
    })

    it('considera expediente que passa da meia-noite', () => {
        expect(isOpenAt(evenings, at(5, 23, 0))).toBe(true)
        expect(isOpenAt(evenings, at(6, 1, 30))).toBe(true)
        expect(isOpenAt(evenings, at(6, 2, 0))).toBe(false)
    })

    it('fica fechado em dia sem horário', () => {
        expect(isOpenAt(evenings, at(2, 20, 0))).toBe(false)
    })
})

describe('getLocalClock', () => {
    it('usa o fuso da loja, não o do aparelho', () => {
        // 2026-11-09 é segunda; 22:30 UTC equivale a 19:30 em São Paulo.
        const clock = getLocalClock(new Date('2026-11-09T22:30:00Z'), 'America/Sao_Paulo')

        expect(clock).toEqual({ weekday: 1, minutes: 19 * MINUTES_PER_HOUR + 30 })
    })
})

describe('describeWeek', () => {
    it('começa na segunda e marca os dias sem horário', () => {
        const week = describeWeek(evenings)

        expect(week[0]).toEqual({ weekday: 1, name: 'Segunda', ranges: ['18:30 às 22:00'] })
        expect(week[1].ranges).toEqual([])
        expect(week[6].name).toBe('Domingo')
    })
})
