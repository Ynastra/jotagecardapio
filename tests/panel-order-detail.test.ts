import { describe, expect, it } from 'vitest'

import { describeChangeNote } from '@/pages/panel-orders/model/change-note'
import { getPreviousStatus } from '@/pages/panel-orders/model/order-flow'
import { buildOrderTimeline } from '@/pages/panel-orders/model/order-timeline'

import { buildPanelOrder } from './fixtures/panel-order'

describe('getPreviousStatus', () => {
    it('volta uma etapa por vez', () => {
        expect(getPreviousStatus('preparing')).toBe('received')
        expect(getPreviousStatus('ready')).toBe('preparing')
        expect(getPreviousStatus('completed')).toBe('ready')
    })

    it('não volta o pedido novo nem o cancelado', () => {
        expect(getPreviousStatus('received')).toBeNull()
        expect(getPreviousStatus('canceled')).toBeNull()
    })
})

describe('describeChangeNote', () => {
    it('diz o valor do troco e quanto levar', () => {
        const note = describeChangeNote(10000, 4198)

        expect(note).toContain('Troco para')
        expect(note).toContain('100,00')
        expect(note).toContain('levar')
        expect(note).toContain('58,02')
    })

    it('não gera nota sem troco ou com valor que não passa do total', () => {
        expect(describeChangeNote(null, 4198)).toBeNull()
        expect(describeChangeNote(4198, 4198)).toBeNull()
        expect(describeChangeNote(3000, 4198)).toBeNull()
    })
})

describe('buildOrderTimeline', () => {
    it('mostra o horário só das etapas alcançadas, no fuso da loja', () => {
        const order = buildPanelOrder({
            createdAt: '2026-11-07T15:00:00Z',
            preparingAt: '2026-11-07T15:10:00Z',
            fulfillment: 'pickup',
        })

        const timeline = buildOrderTimeline(order, 'America/Sao_Paulo')

        expect(timeline).toEqual([
            { label: 'Recebido', time: '12:00' },
            { label: 'Em preparo', time: '12:10' },
            { label: 'Pronto para retirada', time: null },
            { label: 'Concluído', time: null },
        ])
    })

    it('chama a terceira etapa de saiu para entrega na entrega e acrescenta o cancelamento', () => {
        const order = buildPanelOrder({
            fulfillment: 'delivery',
            status: 'canceled',
            canceledAt: '2026-11-07T16:00:00Z',
        })

        const labels = buildOrderTimeline(order, 'America/Sao_Paulo').map((entry) => entry.label)

        expect(labels).toEqual(['Recebido', 'Em preparo', 'Saiu para entrega', 'Concluído', 'Cancelado'])
    })

    it('volta a ficar sem horário quando o status volta e o banco apaga o horário', () => {
        const order = buildPanelOrder({ status: 'preparing', preparingAt: '2026-11-07T15:10:00Z', readyAt: null })

        const timeline = buildOrderTimeline(order, 'America/Sao_Paulo')

        expect(timeline[2].time).toBeNull()
    })
})
