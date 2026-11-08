import { describe, expect, it } from 'vitest'

import {
    buildStatusMessage,
    getStatusMessageType,
    type PanelOrder,
    type StatusMessageContext,
} from '@/entities/order'

function buildOrder(overrides: Partial<PanelOrder>): PanelOrder {
    const order: PanelOrder = {
        id: 'o1',
        number: 7,
        publicCode: '007-490361',
        trackingToken: 'token',
        items: [],
        address: null,
        subtotalCents: 3000,
        deliveryFeeCents: 0,
        paymentFeeCents: 0,
        totalCents: 3000,
        changeForCents: null,
        createdAt: '2026-11-07T12:00:00Z',
        customerName: 'Maria da Silva',
        customerPhone: '11999998888',
        fulfillment: 'delivery',
        paymentMethod: 'pix',
        notes: null,
        status: 'received',
        paymentStatus: 'pending',
        preparingAt: null,
        readyAt: null,
        completedAt: null,
        canceledAt: null,
        ...overrides,
    }
    return order
}

const context: StatusMessageContext = {
    storeName: 'Zé do Burguer',
    trackingUrl: 'https://jgcardapio.com.br/ze/pedido/token',
    stored: [],
}

describe('getStatusMessageType', () => {
    it('mapeia cada status para o tipo de mensagem', () => {
        expect(getStatusMessageType('received', 'delivery')).toBe('confirmed')
        expect(getStatusMessageType('preparing', 'pickup')).toBe('preparing')
        expect(getStatusMessageType('completed', 'delivery')).toBe('completed')
        expect(getStatusMessageType('canceled', 'pickup')).toBe('canceled')
    })

    it('separa saiu para entrega de pronto para retirada pelo tipo do pedido', () => {
        expect(getStatusMessageType('ready', 'delivery')).toBe('out_for_delivery')
        expect(getStatusMessageType('ready', 'pickup')).toBe('ready_for_pickup')
    })
})

describe('buildStatusMessage', () => {
    it('usa o primeiro nome e o link na confirmação', () => {
        const message = buildStatusMessage(buildOrder({}), context)

        expect(message).toBe(
            'Olá, Maria! Seu pedido foi confirmado! Por aqui você receberá todas as atualizações. Link do pedido: https://jgcardapio.com.br/ze/pedido/token',
        )
    })

    it('preenche loja no concluído e código no cancelado', () => {
        const completed = buildStatusMessage(buildOrder({ status: 'completed' }), context)
        const canceled = buildStatusMessage(buildOrder({ status: 'canceled' }), context)

        expect(completed).toBe('Zé do Burguer agradece sua preferência!')
        expect(canceled).toBe('Seu pedido 007-490361 foi cancelado. Se tiver dúvida, é só responder esta mensagem.')
    })

    it('escolhe o texto de entrega ou de retirada no status pronto', () => {
        const delivery = buildStatusMessage(buildOrder({ status: 'ready', fulfillment: 'delivery' }), context)
        const pickup = buildStatusMessage(buildOrder({ status: 'ready', fulfillment: 'pickup' }), context)

        expect(delivery).toBe('Seu pedido saiu para entrega! https://jgcardapio.com.br/ze/pedido/token')
        expect(pickup).toBe('Seu pedido está pronto para retirada! https://jgcardapio.com.br/ze/pedido/token')
    })

    it('dá prioridade ao texto próprio da loja', () => {
        const stored = [{ type: 'preparing', isActive: true, customBody: 'Oi {nome}, na chapa! {link}' }]
        const message = buildStatusMessage(buildOrder({ status: 'preparing' }), { ...context, stored })

        expect(message).toBe('Oi Maria, na chapa! https://jgcardapio.com.br/ze/pedido/token')
    })

    it('cai no texto padrão quando o texto próprio está vazio', () => {
        const stored = [{ type: 'preparing', isActive: true, customBody: '   ' }]
        const message = buildStatusMessage(buildOrder({ status: 'preparing' }), { ...context, stored })

        expect(message).toBe('Seu pedido está sendo preparado! https://jgcardapio.com.br/ze/pedido/token')
    })

    it('devolve nulo quando a mensagem do status está desativada', () => {
        const stored = [{ type: 'preparing', isActive: false, customBody: null }]
        const message = buildStatusMessage(buildOrder({ status: 'preparing' }), { ...context, stored })

        expect(message).toBeNull()
    })

    it('ignora a configuração de outro status', () => {
        const stored = [{ type: 'completed', isActive: false, customBody: null }]
        const message = buildStatusMessage(buildOrder({ status: 'preparing' }), { ...context, stored })

        expect(message).not.toBeNull()
    })
})
