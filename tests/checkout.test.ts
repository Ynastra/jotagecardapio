import { describe, expect, it } from 'vitest'

import {
    buildPlaceOrderPayload,
    describeOrderError,
    EMPTY_CHECKOUT_FORM,
    getDeliveryFeeCents,
    validateCheckout,
    type CheckoutForm,
} from '@/pages/store-menu/model/checkout'
import type { Store } from '@/pages/store-menu/model/types'

const store: Store = {
    id: 'loja',
    slug: 'zedoburguerlucelia',
    name: 'Zé do Burguer',
    address: null,
    whatsapp: '5518996649346',
    logoUrl: null,
    coverUrl: null,
    theme: 'base',
    brandColor: '#060504',
    minOrderCents: 700,
    deliveryFeeCents: 500,
    acceptsDelivery: true,
    acceptsPickup: true,
    enforceOpeningHours: true,
    timezone: 'America/Sao_Paulo',
    hours: [],
    deliveryZones: [],
}

const filledForm: CheckoutForm = {
    ...EMPTY_CHECKOUT_FORM,
    customerName: 'Maria',
    customerPhone: '18996649346',
    street: 'Rua A',
    number: '10',
}

describe('validateCheckout', () => {
    it('aceita um pedido completo', () => {
        expect(validateCheckout(filledForm, store, 3399)).toBeNull()
    })

    it('barra pedido abaixo do mínimo antes de qualquer outro campo', () => {
        expect(validateCheckout(EMPTY_CHECKOUT_FORM, store, 500)).toBe('O pedido mínimo é R$ 7,00.')
    })

    it('exige endereço só na entrega', () => {
        const pickup = { ...filledForm, fulfillment: 'pickup' as const, street: '', number: '' }

        expect(validateCheckout({ ...filledForm, street: '' }, store, 3399)).toBe('Informe a rua e o número para a entrega.')
        expect(validateCheckout(pickup, store, 3399)).toBeNull()
    })

    it('exige bairro quando a loja cobra por bairro', () => {
        const withZones = { ...store, deliveryZones: [{ id: 'centro', neighborhood: 'Centro', feeCents: 300 }] }

        expect(validateCheckout(filledForm, withZones, 3399)).toBe('Escolha o bairro da entrega.')
    })

    it('recusa troco menor que o total com a entrega', () => {
        const cash = { ...filledForm, paymentMethod: 'cash' as const, changeFor: '30' }

        expect(validateCheckout(cash, store, 3399)).toContain('troco')
    })
})

describe('getDeliveryFeeCents', () => {
    it('usa a taxa do bairro, a taxa fixa ou zero na retirada', () => {
        const withZones = { ...store, deliveryZones: [{ id: 'centro', neighborhood: 'Centro', feeCents: 300 }] }

        expect(getDeliveryFeeCents(withZones, { ...filledForm, deliveryZoneId: 'centro' })).toBe(300)
        expect(getDeliveryFeeCents(store, filledForm)).toBe(500)
        expect(getDeliveryFeeCents(store, { ...filledForm, fulfillment: 'pickup' })).toBe(0)
    })
})

describe('buildPlaceOrderPayload', () => {
    it('manda só dígitos do telefone e omite endereço e troco quando não se aplicam', () => {
        const form = { ...filledForm, fulfillment: 'pickup' as const, customerPhone: '(18) 99664-9346', changeFor: '50' }
        const payload = buildPlaceOrderPayload(store.slug, form, [])

        expect(payload.customer_phone).toBe('18996649346')
        expect(payload.address).toBeNull()
        expect(payload.change_for_cents).toBeNull()
    })
})

describe('describeOrderError', () => {
    it('traduz o motivo do banco e tem mensagem para o desconhecido', () => {
        expect(describeOrderError('store_closed')).toContain('fechada')
        expect(describeOrderError('qualquer_coisa')).toContain('tente de novo')
    })
})
