import { describe, expect, it } from 'vitest'

import {
    averageTicketCents,
    marketplaceFeeSavingsCents,
    parseDashboard,
    percentOf,
} from '@/pages/panel-home/model/dashboard'
import { HIDDEN_MONEY_MASK, formatMaskedCents } from '@/pages/panel-home/model/hidden-values'
import { getHomePeriodRange } from '@/pages/panel-home/model/home-period'

const SAO_PAULO = 'America/Sao_Paulo'

describe('parseDashboard', () => {
    it('converte a resposta da função para o formato da tela', () => {
        const dashboard = parseDashboard({
            revenue_cents: 10000,
            orders_count: 3,
            customers_count: 2,
            delivery_count: 2,
            pickup_count: 1,
            canceled_count: 1,
            items_total: 8,
            top_products: [
                {
                    product_id: 'p1',
                    name: 'Coca',
                    image_url: null,
                    price_cents: 700,
                    quantity: 3,
                    revenue_cents: 4500,
                },
            ],
            monthly_revenue: [{ month: '2026-11', revenue_cents: 1100 }],
            in_progress_count: 3,
        })

        expect(dashboard).toEqual({
            revenueCents: 10000,
            ordersCount: 3,
            customersCount: 2,
            deliveryCount: 2,
            pickupCount: 1,
            canceledCount: 1,
            itemsTotal: 8,
            topProducts: [
                { productId: 'p1', name: 'Coca', imageUrl: null, priceCents: 700, quantity: 3, revenueCents: 4500 },
            ],
            monthlyRevenue: [{ month: '2026-11', revenueCents: 1100 }],
            inProgressCount: 3,
        })
    })
})

describe('averageTicketCents', () => {
    it('divide o faturamento pelos pedidos', () => {
        expect(averageTicketCents(10000, 3)).toBe(3333)
    })

    it('devolve nulo sem pedidos', () => {
        expect(averageTicketCents(0, 0)).toBeNull()
    })
})

describe('percentOf', () => {
    it('arredonda o percentual da parte sobre o total', () => {
        expect(percentOf(2, 3)).toBe(67)
        expect(percentOf(1, 3)).toBe(33)
    })

    it('devolve zero quando o total é zero', () => {
        expect(percentOf(0, 0)).toBe(0)
    })
})

describe('marketplaceFeeSavingsCents', () => {
    it('é 25% do faturamento', () => {
        expect(marketplaceFeeSavingsCents(10000)).toBe(2500)
    })
})

describe('formatMaskedCents', () => {
    it('troca o valor pela máscara quando oculto', () => {
        expect(formatMaskedCents(12345, true)).toBe(HIDDEN_MONEY_MASK)
    })

    it('mostra o valor em reais quando visível', () => {
        expect(formatMaskedCents(12345, false)).toMatch(/123,45/)
    })
})

describe('getHomePeriodRange', () => {
    const now = new Date('2026-11-08T15:00:00Z')

    it('hoje vai da meia-noite da loja à próxima', () => {
        const range = getHomePeriodRange('today', now, SAO_PAULO)
        expect(range.start.toISOString()).toBe('2026-11-08T03:00:00.000Z')
        expect(range.end.toISOString()).toBe('2026-11-09T03:00:00.000Z')
    })

    it('últimos 7 dias contam o dia de hoje', () => {
        const range = getHomePeriodRange('last7', now, SAO_PAULO)
        expect(range.start.toISOString()).toBe('2026-11-02T03:00:00.000Z')
    })

    it('últimos 30 dias contam o dia de hoje', () => {
        const range = getHomePeriodRange('last30', now, SAO_PAULO)
        expect(range.start.toISOString()).toBe('2026-10-10T03:00:00.000Z')
    })

    it('este mês começa no dia 1 no fuso da loja', () => {
        const range = getHomePeriodRange('month', new Date('2026-12-01T01:00:00Z'), SAO_PAULO)
        expect(range.start.toISOString()).toBe('2026-11-01T03:00:00.000Z')
    })
})
