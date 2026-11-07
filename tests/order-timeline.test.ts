import { describe, expect, it } from 'vitest'

import { buildTimeline } from '@/pages/order-tracking/model/timeline'
import type { OrderTracking } from '@/pages/order-tracking/model/types'

function createTracking(overrides: Partial<OrderTracking> = {}): OrderTracking {
    const tracking: OrderTracking = {
        store: {
            name: 'Zé do Burguer',
            slug: 'zedoburguerlucelia',
            whatsapp: '5518996649346',
            logoUrl: null,
            brandColor: null,
            theme: 'base',
            timezone: 'America/Sao_Paulo',
            prepTimeMinutes: 40,
            pixKey: null,
            pixKeyType: null,
        },
        publicCode: '007-490361',
        status: 'received',
        paymentStatus: 'pending',
        fulfillment: 'delivery',
        paymentMethod: 'cash',
        createdAt: '2026-11-07T22:00:00Z',
        preparingAt: null,
        readyAt: null,
        completedAt: null,
        canceledAt: null,
        items: [],
        subtotalCents: 4500,
        deliveryFeeCents: 0,
        paymentFeeCents: 0,
        totalCents: 4500,
        ...overrides,
    }
    return tracking
}

describe('buildTimeline', () => {
    it('marca só a primeira etapa como atual num pedido recém-recebido', () => {
        const steps = buildTimeline(createTracking())

        expect(steps.map((step) => step.state)).toEqual(['current', 'upcoming', 'upcoming', 'upcoming'])
        expect(steps[0].at).toBe('2026-11-07T22:00:00Z')
        expect(steps[1].at).toBeNull()
    })

    it('marca as anteriores como concluídas e mostra o horário de cada uma', () => {
        const steps = buildTimeline(
            createTracking({ status: 'ready', preparingAt: '2026-11-07T22:05:00Z', readyAt: '2026-11-07T22:30:00Z' }),
        )

        expect(steps.map((step) => step.state)).toEqual(['done', 'done', 'current', 'upcoming'])
        expect(steps[2].at).toBe('2026-11-07T22:30:00Z')
    })

    it('usa o rótulo da etapa conforme entrega ou retirada', () => {
        const delivery = buildTimeline(createTracking({ fulfillment: 'delivery' }))
        const pickup = buildTimeline(createTracking({ fulfillment: 'pickup' }))

        expect(delivery.map((step) => step.label)).toEqual(['Recebido', 'Em preparo', 'Saiu para entrega', 'Concluído'])
        expect(pickup[2].label).toBe('Pronto para retirada')
    })

    it('deixa o pedido concluído com a última etapa atual', () => {
        const steps = buildTimeline(
            createTracking({
                status: 'completed',
                preparingAt: '2026-11-07T22:05:00Z',
                readyAt: '2026-11-07T22:30:00Z',
                completedAt: '2026-11-07T22:50:00Z',
            }),
        )

        expect(steps.map((step) => step.state)).toEqual(['done', 'done', 'done', 'current'])
    })

    it('no pedido cancelado mantém só as etapas que aconteceram, sem etapa atual', () => {
        const steps = buildTimeline(
            createTracking({
                status: 'canceled',
                preparingAt: '2026-11-07T22:05:00Z',
                canceledAt: '2026-11-07T22:10:00Z',
            }),
        )

        expect(steps.map((step) => step.state)).toEqual(['done', 'done', 'upcoming', 'upcoming'])
    })
})
