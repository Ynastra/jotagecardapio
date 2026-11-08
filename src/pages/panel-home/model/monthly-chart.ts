import type { MonthlyRevenue } from './dashboard'

const FULL_HEIGHT_PERCENT = 100
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const

export type ChartBar = {
    month: string
    label: string
    revenueCents: number
    heightPercent: number
    isCurrent: boolean
}

function getMonthLabel(month: string): string {
    const monthNumber = Number(month.slice(5, 7))
    const label = MONTH_LABELS[monthNumber - 1]
    return label
}

// A série chega em ordem cronológica e termina no mês atual. A maior barra
// ocupa a altura toda; sem nenhuma venda, todas ficam zeradas.
export function buildChartBars(series: MonthlyRevenue[]): ChartBar[] {
    const maxRevenueCents = Math.max(0, ...series.map((entry) => entry.revenueCents))
    const lastIndex = series.length - 1

    const bars = series.map((entry, index) => ({
        month: entry.month,
        label: getMonthLabel(entry.month),
        revenueCents: entry.revenueCents,
        heightPercent: maxRevenueCents === 0 ? 0 : (entry.revenueCents / maxRevenueCents) * FULL_HEIGHT_PERCENT,
        isCurrent: index === lastIndex,
    }))
    return bars
}
