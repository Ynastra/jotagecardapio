import { describe, expect, it } from 'vitest'

import {
    buildPlaceOrderPayload,
    calculateOrderTotals,
    describeOrderError,
    EMPTY_CHECKOUT_FORM,
    getAvailablePaymentMethod,
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
    deliveryMode: 'fixed',
    acceptsDelivery: true,
    acceptsPickup: true,
    enforceOpeningHours: true,
    timezone: 'America/Sao_Paulo',
    prepTimeMinutes: 40,
    city: 'Lucélia',
    state: 'SP',
    addressDisplay: 'full',
    requireCep: false,
    orderCopyWhatsapp: true,
    hideUnavailableItems: true,
    cartNoticeTitle: null,
    cartNoticeBody: null,
    pixKey: null,
    pixKeyType: null,
    hours: [],
    deliveryZones: [],
    freeDeliveryAboveCents: null,
    paymentMethods: [
        { method: 'pix', enabledDelivery: true, enabledPickup: true, feeKind: 'fixed', feePercent: 0, feeFixedCents: 0 },
        { method: 'cash', enabledDelivery: true, enabledPickup: true, feeKind: 'fixed', feePercent: 0, feeFixedCents: 0 },
    ],
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
        const withZones = {
            ...store,
            deliveryMode: 'neighborhood' as const,
            deliveryZones: [{ id: 'centro', neighborhood: 'Centro', feeCents: 300 }],
        }

        expect(validateCheckout(filledForm, withZones, 3399)).toBe('Escolha o bairro da entrega.')
    })

    it('recusa troco menor que o total com a entrega', () => {
        const cash = { ...filledForm, paymentMethod: 'cash' as const, changeFor: '30' }

        expect(validateCheckout(cash, store, 3399)).toContain('troco')
    })
})

describe('getDeliveryFeeCents', () => {
    it('usa a taxa do bairro, a taxa fixa ou zero na retirada', () => {
        const withZones = {
            ...store,
            deliveryMode: 'neighborhood' as const,
            deliveryZones: [{ id: 'centro', neighborhood: 'Centro', feeCents: 300 }],
        }

        expect(getDeliveryFeeCents(withZones, { ...filledForm, deliveryZoneId: 'centro' })).toBe(300)
        expect(getDeliveryFeeCents(store, filledForm)).toBe(500)
        expect(getDeliveryFeeCents(store, { ...filledForm, fulfillment: 'pickup' })).toBe(0)
    })
})

describe('modalidade de entrega', () => {
    const zones = [{ id: 'centro', neighborhood: 'Centro', feeCents: 300 }]
    const lines = [] as const
    const withZoneChosen = { ...filledForm, deliveryZoneId: 'centro' }

    it.each(['fixed', 'radius'] as const)('em %s ignora bairros cadastrados: não exige, cobra a taxa da loja e não envia zona', (mode) => {
        const byMode = { ...store, deliveryMode: mode, deliveryZones: zones }

        expect(validateCheckout(filledForm, byMode, 3399)).toBeNull()
        expect(getDeliveryFeeCents(byMode, withZoneChosen)).toBe(500)
        expect(buildPlaceOrderPayload(byMode, withZoneChosen, lines).delivery_zone_id).toBeNull()
    })

    it('em neighborhood exige o bairro, cobra a taxa dele e envia a zona', () => {
        const byNeighborhood = { ...store, deliveryMode: 'neighborhood' as const, deliveryZones: zones }

        expect(validateCheckout(filledForm, byNeighborhood, 3399)).toBe('Escolha o bairro da entrega.')
        expect(validateCheckout(withZoneChosen, byNeighborhood, 3399)).toBeNull()
        expect(getDeliveryFeeCents(byNeighborhood, withZoneChosen)).toBe(300)
        expect(buildPlaceOrderPayload(byNeighborhood, withZoneChosen, lines).delivery_zone_id).toBe('centro')
    })

    it('na retirada nunca envia zona', () => {
        const byNeighborhood = { ...store, deliveryMode: 'neighborhood' as const, deliveryZones: zones }
        const pickup = { ...withZoneChosen, fulfillment: 'pickup' as const }

        expect(buildPlaceOrderPayload(byNeighborhood, pickup, lines).delivery_zone_id).toBeNull()
    })
})

describe('calculateOrderTotals', () => {
    it('zera a entrega no valor de frete grátis e soma a taxa fixa do pagamento', () => {
        const withRules = {
            ...store,
            freeDeliveryAboveCents: 3000,
            paymentMethods: [
                { method: 'pix' as const, enabledDelivery: true, enabledPickup: true, feeKind: 'fixed' as const, feePercent: 0, feeFixedCents: 150 },
            ],
        }

        expect(calculateOrderTotals(withRules, filledForm, 2999)).toEqual({
            deliveryFeeCents: 500,
            paymentFeeCents: 150,
            totalCents: 3649,
        })
        expect(calculateOrderTotals(withRules, filledForm, 3000)).toEqual({
            deliveryFeeCents: 0,
            paymentFeeCents: 150,
            totalCents: 3150,
        })
    })

    it('arredonda a taxa percentual sobre subtotal mais entrega', () => {
        const withPercent = {
            ...store,
            paymentMethods: [
                { method: 'pix' as const, enabledDelivery: true, enabledPickup: true, feeKind: 'percent' as const, feePercent: 2.5, feeFixedCents: 0 },
            ],
        }

        expect(calculateOrderTotals(withPercent, filledForm, 700).paymentFeeCents).toBe(30)
    })
})

describe('getAvailablePaymentMethod', () => {
    it('troca para a primeira forma ligada quando a escolhida está desligada', () => {
        const onlyDeliveryCash = {
            ...store,
            paymentMethods: [
                { method: 'pix' as const, enabledDelivery: false, enabledPickup: true, feeKind: 'fixed' as const, feePercent: 0, feeFixedCents: 0 },
                { method: 'cash' as const, enabledDelivery: true, enabledPickup: true, feeKind: 'fixed' as const, feePercent: 0, feeFixedCents: 0 },
            ],
        }

        expect(getAvailablePaymentMethod(onlyDeliveryCash, 'delivery', 'pix')).toBe('cash')
        expect(getAvailablePaymentMethod(onlyDeliveryCash, 'pickup', 'pix')).toBe('pix')
    })
})

describe('buildPlaceOrderPayload', () => {
    it('manda só dígitos do telefone e omite endereço e troco quando não se aplicam', () => {
        const form = { ...filledForm, fulfillment: 'pickup' as const, customerPhone: '(18) 99664-9346', changeFor: '50' }
        const payload = buildPlaceOrderPayload(store, form, [])

        expect(payload.customer_phone).toBe('18996649346')
        expect(payload.address).toBeNull()
        expect(payload.change_for_cents).toBeNull()
    })
})

describe('CEP na entrega', () => {
    const requiringCep = { ...store, requireCep: true }

    it('exige 8 dígitos quando a loja pede CEP', () => {
        expect(validateCheckout({ ...filledForm, cep: '' }, requiringCep, 3399)).toBe('Informe o CEP com 8 números.')
        expect(validateCheckout({ ...filledForm, cep: '1778-000' }, requiringCep, 3399)).toBe('Informe o CEP com 8 números.')
        expect(validateCheckout({ ...filledForm, cep: '17780-000' }, requiringCep, 3399)).toBeNull()
    })

    it('não cobra CEP quando a loja não pede ou quando é retirada', () => {
        expect(validateCheckout({ ...filledForm, cep: '' }, store, 3399)).toBeNull()
        expect(validateCheckout({ ...filledForm, fulfillment: 'pickup', cep: '' }, requiringCep, 3399)).toBeNull()
    })

    it('manda CEP só com dígitos, cidade e UF dentro do endereço', () => {
        const form = { ...filledForm, cep: '17780-000', city: ' Lucélia ', state: 'sp' }
        const payload = buildPlaceOrderPayload(requiringCep, form, [])

        expect(payload.address).toMatchObject({ cep: '17780000', city: 'Lucélia', state: 'SP' })
    })

    it('não manda CEP, cidade e UF lembrados quando a loja não pede CEP', () => {
        const form = { ...filledForm, cep: '17780-000', city: 'Lucélia', state: 'SP' }
        const payload = buildPlaceOrderPayload(store, form, [])

        expect(payload.address).toMatchObject({ cep: '', city: '', state: '' })
    })
})

describe('describeOrderError', () => {
    it('traduz o motivo do banco e tem mensagem para o desconhecido', () => {
        expect(describeOrderError('store_closed')).toContain('fechada')
        expect(describeOrderError('qualquer_coisa')).toContain('tente de novo')
    })
})
