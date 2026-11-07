import { describe, expect, it } from 'vitest'

import type { OrderMessageContext } from '@/entities/order'
import { buildOrderConfirmation } from '@/pages/store-menu/model/order-confirmation'

import { createPlacedOrder, createStore } from './fixtures/store-menu'

const store = createStore({ pixKey: '12345678000199', pixKeyType: 'cnpj' })
const order = createPlacedOrder()

const context: OrderMessageContext = {
    storeName: 'Zé do Burguer',
    customerName: 'Maria',
    customerPhone: '18996649346',
    fulfillment: 'delivery',
    paymentMethod: 'pix',
    notes: null,
}

describe('buildOrderConfirmation', () => {
    it('monta código, prazo no fuso da loja e caminho de acompanhamento', () => {
        const details = buildOrderConfirmation(store, order, context)

        expect(details.publicCode).toBe('007-490361')
        expect(details.deadline).toBe('Entrega até 19:40')
        expect(details.trackingPath).toBe('/zedoburguerlucelia/pedido/token')
    })

    it('mostra o bloco do Pix quando o pedido é Pix e a loja tem chave', () => {
        const { pix } = buildOrderConfirmation(store, order, context)

        expect(pix).toMatchObject({ totalCents: 4500, pixKey: '12345678000199', pixKeyKind: 'cnpj' })
        expect(pix?.receiptUrl).toContain(encodeURIComponent('Comprovante do pedido 007-490361'))
    })

    it('não mostra o bloco do Pix sem chave ou em outra forma de pagamento', () => {
        expect(buildOrderConfirmation({ ...store, pixKey: null }, order, context).pix).toBeNull()
        expect(buildOrderConfirmation(store, order, { ...context, paymentMethod: 'cash' }).pix).toBeNull()
    })

    it('só oferece o resumo no WhatsApp quando a loja liga a opção', () => {
        expect(buildOrderConfirmation(store, order, context).whatsappUrl).toContain('https://wa.me/5518996649346')
        expect(buildOrderConfirmation({ ...store, orderCopyWhatsapp: false }, order, context).whatsappUrl).toBeNull()
    })
})
