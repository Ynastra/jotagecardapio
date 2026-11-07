import type { DraftLine, Fulfillment, PaymentMethod } from '@/entities/order'
import { formatCents, isValidBrazilianPhone, isValidCep, keepDigits, parseReaisToCents } from '@/shared/lib'

import type { Store, StorePaymentMethod } from './types'

const MIN_NAME_LENGTH = 2
const PERCENT_DIVISOR = 100

export type CheckoutForm = {
    customerName: string
    customerPhone: string
    fulfillment: Fulfillment
    cep: string
    city: string
    state: string
    street: string
    number: string
    neighborhood: string
    deliveryZoneId: string
    complement: string
    reference: string
    paymentMethod: PaymentMethod
    changeFor: string
    notes: string
}

export const EMPTY_CHECKOUT_FORM: CheckoutForm = {
    customerName: '',
    customerPhone: '',
    fulfillment: 'delivery',
    cep: '',
    city: '',
    state: '',
    street: '',
    number: '',
    neighborhood: '',
    deliveryZoneId: '',
    complement: '',
    reference: '',
    paymentMethod: 'pix',
    changeFor: '',
    notes: '',
}

// Campos que valem a pena lembrar entre um pedido e outro do mesmo aparelho.
export const REMEMBERED_FIELDS = [
    'customerName',
    'customerPhone',
    'cep',
    'city',
    'state',
    'street',
    'number',
    'neighborhood',
    'complement',
    'reference',
] as const satisfies readonly (keyof CheckoutForm)[]

export type PlaceOrderPayload = {
    store_slug: string
    customer_name: string
    customer_phone: string
    fulfillment: Fulfillment
    address: {
        cep: string
        city: string
        state: string
        street: string
        number: string
        neighborhood: string
        complement: string
        reference: string
    } | null
    delivery_zone_id: string | null
    payment_method: PaymentMethod
    change_for_cents: number | null
    notes: string
    items: { product_id: string; quantity: number; notes: string; options: { option_id: string; quantity: number }[] }[]
}

export type OrderTotals = {
    deliveryFeeCents: number
    paymentFeeCents: number
    totalCents: number
}

export function getAvailableFulfillment(store: Store, requested: Fulfillment): Fulfillment {
    const canDeliver = requested === 'delivery' && store.acceptsDelivery
    const canPickUp = requested === 'pickup' && store.acceptsPickup
    const fallback: Fulfillment = store.acceptsDelivery ? 'delivery' : 'pickup'

    const fulfillment = canDeliver || canPickUp ? requested : fallback
    return fulfillment
}

export function getDeliveryFeeCents(store: Store, form: CheckoutForm): number {
    if (form.fulfillment === 'pickup') {
        return 0
    }

    const zone = store.deliveryZones.find((candidate) => candidate.id === form.deliveryZoneId)
    const fee = zone ? zone.feeCents : store.deliveryFeeCents
    return fee
}

export function getAvailablePaymentMethods(store: Store, fulfillment: Fulfillment): StorePaymentMethod[] {
    const available = store.paymentMethods.filter((payment) =>
        fulfillment === 'delivery' ? payment.enabledDelivery : payment.enabledPickup,
    )
    return available
}

export function getAvailablePaymentMethod(store: Store, fulfillment: Fulfillment, requested: PaymentMethod): PaymentMethod {
    const available = getAvailablePaymentMethods(store, fulfillment)
    const isRequestedAvailable = available.some((payment) => payment.method === requested)
    const keepsRequested = isRequestedAvailable || available.length === 0

    const method = keepsRequested ? requested : available[0].method
    return method
}

function getPaymentFeeCents(payment: StorePaymentMethod | undefined, payableCents: number): number {
    if (!payment) {
        return 0
    }

    const percentFeeCents = Math.round((payableCents * payment.feePercent) / PERCENT_DIVISOR)
    const feeCents = payment.feeKind === 'percent' ? percentFeeCents : payment.feeFixedCents
    return feeCents
}

// Estimativa do navegador; o valor que vale é o que a place_order grava.
export function calculateOrderTotals(store: Store, form: CheckoutForm, subtotalCents: number): OrderTotals {
    const isFreeDelivery = store.freeDeliveryAboveCents !== null && subtotalCents >= store.freeDeliveryAboveCents
    const deliveryFeeCents = isFreeDelivery ? 0 : getDeliveryFeeCents(store, form)

    const payment = store.paymentMethods.find((candidate) => candidate.method === form.paymentMethod)
    const paymentFeeCents = getPaymentFeeCents(payment, subtotalCents + deliveryFeeCents)

    const totals = {
        deliveryFeeCents,
        paymentFeeCents,
        totalCents: subtotalCents + deliveryFeeCents + paymentFeeCents,
    }
    return totals
}

function validateDelivery(form: CheckoutForm, store: Store): string | null {
    if (form.fulfillment === 'pickup') {
        return null
    }
    if (store.requireCep && !isValidCep(form.cep)) {
        return 'Informe o CEP com 8 números.'
    }
    if (!form.street.trim() || !form.number.trim()) {
        return 'Informe a rua e o número para a entrega.'
    }
    if (store.deliveryZones.length > 0 && !form.deliveryZoneId) {
        return 'Escolha o bairro da entrega.'
    }

    const noError = null
    return noError
}

function validatePayment(form: CheckoutForm, store: Store, totalCents: number): string | null {
    const isMethodAvailable = getAvailablePaymentMethods(store, form.fulfillment).some(
        (payment) => payment.method === form.paymentMethod,
    )
    if (!isMethodAvailable) {
        return 'Escolha a forma de pagamento.'
    }

    const changeForCents = parseReaisToCents(form.changeFor)
    const needsMoreChange = form.paymentMethod === 'cash' && changeForCents !== null && changeForCents < totalCents

    if (needsMoreChange) {
        const message = `O troco precisa ser para um valor igual ou maior que ${formatCents(totalCents)}.`
        return message
    }

    const noError = null
    return noError
}

// Devolve a primeira coisa que falta, na ordem em que a pessoa vê o formulário.
export function validateCheckout(form: CheckoutForm, store: Store, subtotalCents: number): string | null {
    const { totalCents } = calculateOrderTotals(store, form, subtotalCents)

    if (subtotalCents < store.minOrderCents) {
        const message = `O pedido mínimo é ${formatCents(store.minOrderCents)}.`
        return message
    }
    if (form.customerName.trim().length < MIN_NAME_LENGTH) {
        return 'Informe seu nome.'
    }
    if (!isValidBrazilianPhone(form.customerPhone)) {
        return 'Informe um telefone com DDD.'
    }

    const firstError = validateDelivery(form, store) ?? validatePayment(form, store, totalCents)
    return firstError
}

export function buildPlaceOrderPayload(
    store: Pick<Store, 'slug' | 'requireCep'>,
    form: CheckoutForm,
    lines: readonly DraftLine[],
): PlaceOrderPayload {
    const storeSlug = store.slug
    const sendsCep = store.requireCep
    const isDelivery = form.fulfillment === 'delivery'
    // CEP, cidade e UF lembrados de outra loja não vão para quem não pede CEP.
    const address = isDelivery
        ? {
              cep: sendsCep ? keepDigits(form.cep) : '',
              city: sendsCep ? form.city.trim() : '',
              state: sendsCep ? form.state.trim().toUpperCase() : '',
              street: form.street.trim(),
              number: form.number.trim(),
              neighborhood: form.neighborhood.trim(),
              complement: form.complement.trim(),
              reference: form.reference.trim(),
          }
        : null
    const changeForCents = form.paymentMethod === 'cash' ? parseReaisToCents(form.changeFor) : null

    const payload = {
        store_slug: storeSlug,
        customer_name: form.customerName.trim(),
        customer_phone: keepDigits(form.customerPhone),
        fulfillment: form.fulfillment,
        address,
        delivery_zone_id: isDelivery && form.deliveryZoneId ? form.deliveryZoneId : null,
        payment_method: form.paymentMethod,
        change_for_cents: changeForCents,
        notes: form.notes.trim(),
        items: lines.map((line) => ({
            product_id: line.productId,
            quantity: line.quantity,
            notes: line.notes.trim(),
            options: line.options.map((option) => ({ option_id: option.optionId, quantity: option.quantity })),
        })),
    }
    return payload
}

const ORDER_ERROR_MESSAGES: Record<string, string> = {
    store_not_found: 'Esta loja não está recebendo pedidos pelo cardápio.',
    store_closed: 'A loja está fechada agora. O pedido pode ser enviado quando ela abrir.',
    invalid_customer_name: 'Confira o seu nome.',
    invalid_customer_phone: 'Confira o telefone com DDD.',
    invalid_payment_method: 'Escolha a forma de pagamento.',
    payment_method_unavailable: 'Esta forma de pagamento não está disponível para este pedido. Escolha outra.',
    invalid_cep: 'Confira o CEP da entrega.',
    invalid_address:'Confira a rua e o número da entrega.',
    delivery_unavailable: 'A loja não está fazendo entregas. Escolha retirar na loja.',
    pickup_unavailable: 'A loja não está com retirada no balcão. Escolha entrega.',
    invalid_delivery_zone: 'Este bairro não está mais na área de entrega.',
    delivery_zone_required: 'Escolha o bairro da entrega.',
    empty_order: 'A sacola está vazia.',
    product_unavailable: 'Um item da sacola não está mais disponível. Remova e tente de novo.',
    insufficient_stock: 'Um item da sacola não tem estoque para essa quantidade. Diminua a quantidade e tente de novo.',
    option_unavailable: 'Um opcional escolhido não está mais disponível. Remova o item e monte de novo.',
    invalid_option_selection: 'Um item ficou com opcionais incompletos. Remova e monte de novo.',
    below_minimum_order: 'O pedido não atingiu o valor mínimo da loja.',
    invalid_change: 'O troco precisa ser para um valor maior que o total.',
}

const UNKNOWN_ERROR_MESSAGE = 'Não deu para enviar o pedido. Confira a internet e tente de novo.'

export function describeOrderError(code: string): string {
    const message = ORDER_ERROR_MESSAGES[code] ?? UNKNOWN_ERROR_MESSAGE
    return message
}
