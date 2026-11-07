import { describe, expect, it } from 'vitest'

import { getPeriodStart } from '@/pages/panel-orders/model/period'

const SAO_PAULO = 'America/Sao_Paulo'

function startIso(period: Parameters<typeof getPeriodStart>[0], nowIso: string, timeZone = SAO_PAULO): string {
    const start = getPeriodStart(period, new Date(nowIso), timeZone).toISOString()
    return start
}

describe('getPeriodStart', () => {
    it('começa o dia à meia-noite do fuso da loja', () => {
        expect(startIso('today', '2026-11-07T15:00:00Z')).toBe('2026-11-07T03:00:00.000Z')
    })

    it('ainda é o dia anterior na loja quando já virou o dia em UTC', () => {
        expect(startIso('today', '2026-11-07T02:00:00Z')).toBe('2026-11-06T03:00:00.000Z')
    })

    it('respeita um fuso à frente de UTC', () => {
        expect(startIso('today', '2026-11-07T20:00:00Z', 'Asia/Tokyo')).toBe('2026-11-07T15:00:00.000Z')
    })

    it('começa a semana na segunda-feira', () => {
        expect(startIso('week', '2026-11-07T15:00:00Z')).toBe('2026-11-02T03:00:00.000Z')
        expect(startIso('week', '2026-11-08T15:00:00Z')).toBe('2026-11-02T03:00:00.000Z')
        expect(startIso('week', '2026-11-02T15:00:00Z')).toBe('2026-11-02T03:00:00.000Z')
    })

    it('volta ao mês anterior quando a semana cruza a virada de mês', () => {
        expect(startIso('week', '2026-12-02T15:00:00Z')).toBe('2026-11-30T03:00:00.000Z')
    })

    it('começa o mês no dia 1', () => {
        expect(startIso('month', '2026-11-20T15:00:00Z')).toBe('2026-11-01T03:00:00.000Z')
    })

    it('na virada de mês em UTC, ainda conta o mês anterior na loja', () => {
        expect(startIso('month', '2026-12-01T02:00:00Z')).toBe('2026-11-01T03:00:00.000Z')
    })

    it('volta três meses para os últimos 3 meses', () => {
        expect(startIso('quarter', '2026-11-30T15:00:00Z')).toBe('2026-08-30T03:00:00.000Z')
    })

    it('limita ao último dia do mês quando o dia não existe três meses atrás', () => {
        expect(startIso('quarter', '2026-05-31T15:00:00Z')).toBe('2026-02-28T03:00:00.000Z')
    })

    it('atravessa a virada de ano nos últimos 3 meses', () => {
        expect(startIso('quarter', '2026-01-15T15:00:00Z')).toBe('2025-10-15T03:00:00.000Z')
    })
})
