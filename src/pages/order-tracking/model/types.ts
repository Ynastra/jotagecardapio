import type { Fulfillment, OrderLine, OrderPaymentStatus, OrderStatus, PaymentMethod } from '@/entities/order'

export type TrackedStore = {
    name: string
    slug: string
    whatsapp: string
    logoUrl: string | null
    brandColor: string | null
    theme: string
    timezone: string
    prepTimeMinutes: number
    pixKey: string | null
    pixKeyType: 'cnpj' | 'cpf' | 'email' | 'phone' | 'random' | null
}

export type OrderTracking = {
    store: TrackedStore
    publicCode: string
    status: OrderStatus
    paymentStatus: OrderPaymentStatus
    fulfillment: Fulfillment
    paymentMethod: PaymentMethod
    createdAt: string
    preparingAt: string | null
    readyAt: string | null
    completedAt: string | null
    canceledAt: string | null
    items: OrderLine[]
    subtotalCents: number
    deliveryFeeCents: number
    paymentFeeCents: number
    totalCents: number
}
