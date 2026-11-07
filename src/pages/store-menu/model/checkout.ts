import type { DraftLine, Fulfillment, PaymentMethod } from '@/entities/order'
import { formatCents, isValidBrazilianPhone, keepDigits, parseReaisToCents } from '@/shared/lib'

import type { Store } from './types'

const MIN_NAME_LENGTH = 2

export type CheckoutForm = {
    customerName: string
    customerPhone: string
    fulfillment: Fulfillment
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
    address: { street: string; number: string; neighborhood: string; complement: string; reference: string } | null
    delivery_zone_id: string | null
    payment_method: PaymentMethod
    change_for_cents: number | null
    notes: string
    items: { product_id: string; quantity: number; notes: string; options: { option_id: string; quantity: number }[] }[]
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

function validateDelivery(form: CheckoutForm, store: Store): string | null {
    if (form.fulfillment === 'pickup') {
        return null
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

function validatePayment(form: CheckoutForm, totalCents: number): string | null {
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
    const totalCents = subtotalCents + getDeliveryFeeCents(store, form)

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

    const firstError = validateDelivery(form, store) ?? validatePayment(form, totalCents)
    return firstError
}

export function buildPlaceOrderPayload(storeSlug: string, form: CheckoutForm, lines: readonly DraftLine[]): PlaceOrderPayload {
    const isDelivery = form.fulfillment === 'delivery'
    const address = isDelivery
        ? {
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
    invalid_address: 'Confira a rua e o número da entrega.',
    delivery_unavailable: 'A loja não está fazendo entregas. Escolha retirar na loja.',
    pickup_unavailable: 'A loja não está com retirada no balcão. Escolha entrega.',
    invalid_delivery_zone: 'Este bairro não está mais na área de entrega.',
    delivery_zone_required: 'Escolha o bairro da entrega.',
    empty_order: 'A sacola está vazia.',
    product_unavailable: 'Um item da sacola não está mais disponível. Remova e tente de novo.',
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
