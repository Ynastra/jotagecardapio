import {
    buildOrderMessage,
    buildWhatsappUrl,
    describeOrderDeadline,
    type OrderMessageContext,
    type PlacedOrder,
} from '@/entities/order'

import type { PixKeyType, Store } from './types'

export type OrderConfirmationDetails = {
    publicCode: string
    deadline: string
    trackingPath: string
    whatsappUrl: string | null
    pix: { totalCents: number; pixKey: string; pixKeyKind: PixKeyType | null; receiptUrl: string } | null
}

export function buildOrderConfirmation(
    store: Store,
    order: PlacedOrder,
    context: OrderMessageContext,
): OrderConfirmationDetails {
    const summaryMessage = buildOrderMessage(order, context)
    const whatsappUrl = store.orderCopyWhatsapp ? buildWhatsappUrl(store.whatsapp, summaryMessage) : null

    const paysWithPix = context.paymentMethod === 'pix' && store.pixKey !== null
    const receiptUrl = buildWhatsappUrl(store.whatsapp, `Comprovante do pedido ${order.publicCode}`)
    const pix =
        paysWithPix && store.pixKey
            ? { totalCents: order.totalCents, pixKey: store.pixKey, pixKeyKind: store.pixKeyType, receiptUrl }
            : null

    const details = {
        publicCode: order.publicCode,
        deadline: describeOrderDeadline(order.createdAt, store.prepTimeMinutes, store.timezone, context.fulfillment),
        trackingPath: `/${store.slug}/pedido/${order.trackingToken}`,
        whatsappUrl,
        pix,
    }
    return details
}
