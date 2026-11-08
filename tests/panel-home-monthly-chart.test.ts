import { describe, expect, it } from 'vitest'

import { buildChartBars } from '@/pages/panel-home/model/monthly-chart'

describe('buildChartBars', () => {
    it('escala as barras pela maior receita da série', () => {
        const bars = buildChartBars([
            { month: '2026-09', revenueCents: 5000 },
            { month: '2026-10', revenueCents: 10000 },
            { month: '2026-11', revenueCents: 2500 },
        ])

        expect(bars.map((bar) => bar.heightPercent)).toEqual([50, 100, 25])
    })

    it('zera todas as barras quando o máximo é zero', () => {
        const bars = buildChartBars([
            { month: '2026-10', revenueCents: 0 },
            { month: '2026-11', revenueCents: 0 },
        ])

        expect(bars.map((bar) => bar.heightPercent)).toEqual([0, 0])
    })

    it('marca só o último mês, o atual', () => {
        const bars = buildChartBars([
            { month: '2026-10', revenueCents: 100 },
            { month: '2026-11', revenueCents: 200 },
        ])

        expect(bars.map((bar) => bar.isCurrent)).toEqual([false, true])
    })

    it('rotula os meses na virada do ano', () => {
        const bars = buildChartBars([
            { month: '2025-12', revenueCents: 100 },
            { month: '2026-01', revenueCents: 100 },
            { month: '2026-02', revenueCents: 100 },
        ])

        expect(bars.map((bar) => bar.label)).toEqual(['dez', 'jan', 'fev'])
    })

    it('devolve lista vazia sem série', () => {
        expect(buildChartBars([])).toEqual([])
    })
})
