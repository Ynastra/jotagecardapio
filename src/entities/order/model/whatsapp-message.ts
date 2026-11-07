import { formatCents, formatBrazilianPhone, formatCep } from '@/shared/lib'

import { PAYMENT_LABELS } from './labels'
import type { Fulfillment, OrderAddress, OrderLine, PaymentMethod, PlacedOrder } from './types'

export type OrderMessageContext = {
    storeName: string
    customerName: string
    customerPhone: string
    fulfillment: Fulfillment
    paymentMethod: PaymentMethod
    notes: string | null
}

function describeLine(line: OrderLine): string[] {
    const header = `*${line.quantity}x ${line.name}* · ${formatCents(line.totalCents)}`
    const optionLines = line.options.map((option) => {
        const quantityPrefix = option.quantity > 1 ? `${option.quantity}x ` : ''
        const priceSuffix = option.unitPriceCents > 0 ? ` (+${formatCents(option.unitPriceCents * option.quantity)})` : ''
        const optionText = `   ${quantityPrefix}${option.name}${priceSuffix}`
        return optionText
    })
    const notesLines = line.notes ? [`   Obs.: ${line.notes}`] : []

    const lines = [header, ...optionLines, ...notesLines]
    return lines
}

function describeAddress(address: OrderAddress): string {
    const cityLine = [address.city, address.state].filter(Boolean).join('/')
    const cepLine = address.cep ? `CEP ${formatCep(address.cep)}` : ''
    const parts = [`${address.street}, ${address.number}`, address.neighborhood, address.complement, cityLine, cepLine]
    const reference = address.reference ? `. Ref.: ${address.reference}` : ''
    const description = `${parts.filter(Boolean).join(', ')}${reference}`
    return description
}

function describePayment(order: PlacedOrder, paymentMethod: PaymentMethod): string {
    const changeNote = order.changeForCents ? `, troco para ${formatCents(order.changeForCents)}` : ''
    const description = `*Pagamento:* ${PAYMENT_LABELS[paymentMethod]}${changeNote}`
    return description
}

export function buildOrderMessage(order: PlacedOrder, context: OrderMessageContext): string {
    const isDelivery = context.fulfillment === 'delivery'
    const itemBlocks = order.items.flatMap((line) => [...describeLine(line), ''])
    const deliveryFeeLine = isDelivery ? [`Entrega: ${formatCents(order.deliveryFeeCents)}`] : []
    const paymentFeeLine = order.paymentFeeCents > 0 ? [`Taxa de pagamento: ${formatCents(order.paymentFeeCents)}`] : []
    const destination =
        isDelivery && order.address ? `*Entregar em:* ${describeAddress(order.address)}` : '*Retirada na loja*'
    const notesLine = context.notes ? [`*Observações:* ${context.notes}`] : []

    const message = [
        `*Pedido #${order.number}* · ${context.storeName}`,
        '',
        ...itemBlocks,
        `Subtotal: ${formatCents(order.subtotalCents)}`,
        ...deliveryFeeLine,
        ...paymentFeeLine,
        `*Total: ${formatCents(order.totalCents)}*`,
        '',
        destination,
        describePayment(order, context.paymentMethod),
        `*Cliente:* ${context.customerName} · ${formatBrazilianPhone(context.customerPhone)}`,
        ...notesLine,
    ].join('\n')
    return message
}

export function buildWhatsappUrl(whatsappDigits: string, message: string): string {
    const url = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
    return url
}
