import type { PaymentMethod } from '@/entities/order'
import type { Product } from '@/entities/product'

export type { OptionGroup, Product, ProductOption } from '@/entities/product'

export type StoreHours = {
    // 0 = domingo, igual ao Date do JavaScript e ao Postgres.
    weekday: number
    opensAt: string
    closesAt: string
}

export type DeliveryZone = {
    id: string
    neighborhood: string
    feeCents: number
}

export type StorePaymentMethod = {
    method: PaymentMethod
    enabledDelivery: boolean
    enabledPickup: boolean
    feeKind: 'percent' | 'fixed'
    feePercent: number
    feeFixedCents: number
}

export type AddressDisplay = 'hidden' | 'city' | 'full'

export type PixKeyType = 'cnpj' | 'cpf' | 'email' | 'phone' | 'random'

export type DeliveryMode = 'fixed' | 'radius' | 'neighborhood'

export type Store = {
    id: string
    slug: string
    name: string
    address: string | null
    whatsapp: string
    logoUrl: string | null
    coverUrl: string | null
    theme: string
    brandColor: string | null
    minOrderCents: number
    deliveryFeeCents: number
    deliveryMode: DeliveryMode
    acceptsDelivery: boolean
    acceptsPickup: boolean
    enforceOpeningHours: boolean
    timezone: string
    prepTimeMinutes: number
    city: string | null
    state: string | null
    addressDisplay: AddressDisplay
    requireCep: boolean
    orderCopyWhatsapp: boolean
    hideUnavailableItems: boolean
    cartNoticeTitle: string | null
    cartNoticeBody: string | null
    pixKey: string | null
    pixKeyType: PixKeyType | null
    hours: StoreHours[]
    deliveryZones: DeliveryZone[]
    freeDeliveryAboveCents: number | null
    paymentMethods: StorePaymentMethod[]
}

export type Category = {
    id: string
    name: string
    iconUrl: string | null
    products: Product[]
}

export type StoreMenu = {
    store: Store
    categories: Category[]
}
