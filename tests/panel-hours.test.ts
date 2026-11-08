import { describe, expect, it } from 'vitest'

import {
    applyPeriodWrite,
    describePeriodTime,
    groupIntoPeriods,
    planPeriodWrite,
    validatePeriodDraft,
    type HourRow,
    type Period,
} from '@/pages/panel-hours/model/hours'

function row(id: string, weekday: number, opensAt: string, closesAt: string): HourRow {
    return { id, weekday, opensAt, closesAt }
}

function period(weekdays: number[], opensAt: string, closesAt: string): Period {
    return { key: `${opensAt}-${closesAt}`, opensAt, closesAt, weekdays, rowIds: weekdays.map((day) => `r${day}`) }
}

describe('groupIntoPeriods', () => {
    it('junta as linhas com o mesmo início e fim e ordena os dias de domingo a sábado', () => {
        const periods = groupIntoPeriods([
            row('a', 5, '18:30:00', '22:00:00'),
            row('b', 1, '18:30:00', '22:00:00'),
            row('c', 0, '18:30:00', '22:00:00'),
        ])

        expect(periods).toHaveLength(1)
        expect(periods[0]).toMatchObject({ opensAt: '18:30', closesAt: '22:00', weekdays: [0, 1, 5] })
        expect(periods[0].rowIds).toEqual(['a', 'b', 'c'])
    })

    it('separa períodos com horários diferentes e ordena pelo início', () => {
        const periods = groupIntoPeriods([
            row('a', 1, '18:00', '23:00'),
            row('b', 1, '11:00', '14:00'),
            row('c', 2, '11:00', '14:00'),
        ])

        expect(periods.map((item) => item.opensAt)).toEqual(['11:00', '18:00'])
        expect(periods[0].weekdays).toEqual([1, 2])
    })

    it('devolve lista vazia sem linhas', () => {
        expect(groupIntoPeriods([])).toEqual([])
    })
})

describe('describePeriodTime', () => {
    it('mostra início e fim, e avisa quando o fim é no dia seguinte', () => {
        expect(describePeriodTime({ opensAt: '18:30', closesAt: '22:00' })).toBe('18:30 até 22:00')
        expect(describePeriodTime({ opensAt: '18:00', closesAt: '02:00' })).toBe('18:00 até 02:00 do dia seguinte')
    })
})

describe('validatePeriodDraft', () => {
    const monday = period([1], '18:00', '23:00')

    it('exige pelo menos um dia', () => {
        const errors = validatePeriodDraft({ weekdays: [], opensAt: '10:00', closesAt: '12:00' }, [])

        expect(errors.weekdays).toBe('Escolha pelo menos um dia.')
    })

    it('exige início e fim preenchidos e diferentes entre si', () => {
        expect(validatePeriodDraft({ weekdays: [1], opensAt: '', closesAt: '12:00' }, []).time).toBe(
            'Informe o início e o fim.',
        )
        expect(validatePeriodDraft({ weekdays: [1], opensAt: '12:00', closesAt: '12:00' }, []).time).toBe(
            'O início precisa ser diferente do fim.',
        )
    })

    it('aceita períodos que se encostam sem sobrepor', () => {
        const errors = validatePeriodDraft({ weekdays: [1], opensAt: '23:00', closesAt: '23:30' }, [monday])

        expect(errors).toEqual({})
    })

    it('recusa sobreposição no mesmo dia e diz o dia', () => {
        const errors = validatePeriodDraft({ weekdays: [1, 2], opensAt: '20:00', closesAt: '21:00' }, [monday])

        expect(errors.time).toBe('Sobrepõe outro horário na segunda.')
    })

    it('não sobrepõe em dias diferentes com o mesmo horário', () => {
        const errors = validatePeriodDraft({ weekdays: [2], opensAt: '18:00', closesAt: '23:00' }, [monday])

        expect(errors).toEqual({})
    })

    it('considera o trecho que passa da meia-noite no dia seguinte', () => {
        const mondayLate = period([1], '22:00', '02:00')

        const early = validatePeriodDraft({ weekdays: [2], opensAt: '01:00', closesAt: '05:00' }, [mondayLate])
        const later = validatePeriodDraft({ weekdays: [2], opensAt: '02:00', closesAt: '05:00' }, [mondayLate])

        expect(early.time).toBe('Sobrepõe outro horário na terça.')
        expect(later).toEqual({})
    })

    it('considera a virada da meia-noite do rascunho contra períodos do dia seguinte', () => {
        const tuesdayMorning = period([2], '00:30', '03:00')

        const errors = validatePeriodDraft({ weekdays: [1], opensAt: '23:00', closesAt: '01:00' }, [tuesdayMorning])

        expect(errors.time).toBe('Sobrepõe outro horário na terça.')
    })

    it('liga a virada de sábado para domingo', () => {
        const sundayMorning = period([0], '00:00', '04:00')

        const errors = validatePeriodDraft({ weekdays: [6], opensAt: '22:00', closesAt: '01:00' }, [sundayMorning])

        expect(errors.time).toBe('Sobrepõe outro horário no domingo.')
    })

    it('não acusa sobreposição consigo mesmo quando o período editado fica fora da lista', () => {
        const errors = validatePeriodDraft({ weekdays: [1], opensAt: '18:00', closesAt: '22:00' }, [])

        expect(errors).toEqual({})
    })
})

describe('planPeriodWrite', () => {
    const existing = [row('seg', 1, '18:00:00', '22:00:00'), row('ter', 2, '18:00:00', '22:00:00')]

    it('para um período novo só insere uma linha por dia', () => {
        const plan = planPeriodWrite([], { weekdays: [1, 3], opensAt: '10:00', closesAt: '12:00' })

        expect(plan.inserts).toEqual([
            { weekday: 1, opensAt: '10:00', closesAt: '12:00' },
            { weekday: 3, opensAt: '10:00', closesAt: '12:00' },
        ])
        expect(plan.deleteIds).toEqual([])
    })

    it('mantém as linhas que continuam, insere os dias novos e remove os que saíram', () => {
        const plan = planPeriodWrite(existing, { weekdays: [2, 4], opensAt: '18:00', closesAt: '22:00' })

        expect(plan.inserts).toEqual([{ weekday: 4, opensAt: '18:00', closesAt: '22:00' }])
        expect(plan.deleteIds).toEqual(['seg'])
    })

    it('troca todas as linhas quando o horário muda', () => {
        const plan = planPeriodWrite(existing, { weekdays: [1, 2], opensAt: '19:00', closesAt: '22:00' })

        expect(plan.inserts).toHaveLength(2)
        expect(plan.deleteIds).toEqual(['seg', 'ter'])
    })

    it('não grava nada quando nada mudou', () => {
        const plan = planPeriodWrite(existing, { weekdays: [1, 2], opensAt: '18:00', closesAt: '22:00' })

        expect(plan).toEqual({ inserts: [], deleteIds: [] })
    })
})

describe('applyPeriodWrite', () => {
    it('insere antes de remover', async () => {
        const calls: string[] = []
        const writer = {
            insertRows: async () => {
                calls.push('insert')
            },
            deleteRows: async () => {
                calls.push('delete')
            },
        }

        await applyPeriodWrite({ inserts: [{ weekday: 1, opensAt: '19:00', closesAt: '22:00' }], deleteIds: ['seg'] }, writer)

        expect(calls).toEqual(['insert', 'delete'])
    })

    it('não remove nada quando a inserção falha', async () => {
        const calls: string[] = []
        const writer = {
            insertRows: async () => {
                throw new Error('falha de rede')
            },
            deleteRows: async () => {
                calls.push('delete')
            },
        }

        await expect(
            applyPeriodWrite({ inserts: [{ weekday: 1, opensAt: '19:00', closesAt: '22:00' }], deleteIds: ['seg'] }, writer),
        ).rejects.toThrow('falha de rede')
        expect(calls).toEqual([])
    })

    it('pula as chamadas vazias', async () => {
        const calls: string[] = []
        const writer = {
            insertRows: async () => {
                calls.push('insert')
            },
            deleteRows: async () => {
                calls.push('delete')
            },
        }

        await applyPeriodWrite({ inserts: [], deleteIds: ['seg'] }, writer)

        expect(calls).toEqual(['delete'])
    })
})
