import { describe, expect, it } from 'vitest'

import { buildOrderMessage, buildWhatsappUrl, type PlacedOrder } from '@/entities/order'

const order: PlacedOrder = {
    id: 'pedido',
    number: 12,
    publicCode: '012-490361',
    trackingToken: 'token-de-acompanhamento',
    items: [
        {
            productId: 'x-bacon',
            name: 'X-BACON',
            quantity: 2,
            unitPriceCents: 3799,
            totalCents: 7598,
            notes: 'sem cebola',
            options: [
                { optionId: 'ao-ponto', groupTitle: 'Ponto', name: 'Ao ponto', quantity: 1, unitPriceCents: 0 },
                { optionId: 'bacon', groupTitle: 'Turbinar', name: 'Bacon Fatiado 3x', quantity: 1, unitPriceCents: 400 },
            ],
        },
    ],
    address: {
        cep: '17780000',
        city: 'Lucélia',
        state: 'SP',
        street: 'Rua A',
        number: '10',
        neighborhood: 'Centro',
        complement: '',
        reference: 'Portão azul',
    },
    subtotalCents: 7598,
    deliveryFeeCents: 500,
    paymentFeeCents: 0,
    totalCents: 8098,
    changeForCents: 10000,
    createdAt: '2026-11-07T22:00:00Z',
}

describe('buildOrderMessage', () => {
    it('monta o resumo que a loja recebe no WhatsApp', () => {
        const message = buildOrderMessage(order, {
            storeName: 'Zé do Burguer',
            customerName: 'Maria',
            customerPhone: '18996649346',
            fulfillment: 'delivery',
            paymentMethod: 'cash',
            notes: null,
        })

        expect(message).toContain('*Pedido #12* · Zé do Burguer')
        expect(message).toContain('*2x X-BACON* · R$ 75,98')
        expect(message).toContain('   Bacon Fatiado 3x (+R$ 4,00)')
        expect(message).toContain('   Obs.: sem cebola')
        expect(message).toContain('Entrega: R$ 5,00')
        expect(message).toContain('*Entregar em:* Rua A, 10, Centro, Lucélia/SP, CEP 17780-000. Ref.: Portão azul')
        expect(message).toContain('*Pagamento:* Dinheiro, troco para R$ 100,00')
        expect(message).toContain('*Cliente:* Maria · (18) 99664-9346')
    })

    it('troca o endereço por retirada e esconde a taxa de entrega', () => {
        const message = buildOrderMessage(
            { ...order, address: null, deliveryFeeCents: 0, changeForCents: null },
            {
                storeName: 'Zé do Burguer',
                customerName: 'Maria',
                customerPhone: '18996649346',
                fulfillment: 'pickup',
                paymentMethod: 'pix',
                notes: 'chego às 20h',
            },
        )

        expect(message).toContain('*Retirada na loja*')
        expect(message).not.toContain('Entrega:')
        expect(message).toContain('*Observações:* chego às 20h')
    })
})

describe('buildWhatsappUrl', () => {
    it('codifica a mensagem no link do wa.me', () => {
        expect(buildWhatsappUrl('5518996649346', 'Oi #1')).toBe('https://wa.me/5518996649346?text=Oi%20%231')
    })
})
