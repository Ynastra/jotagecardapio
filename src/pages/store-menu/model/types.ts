import type { PaymentMethod } from '@/entities/order'

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
    acceptsDelivery: boolean
    acceptsPickup: boolean
    enforceOpeningHours: boolean
    timezone: string
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

export type ProductOption = {
    id: string
    name: string
    description: string | null
    imageUrl?: string | null
    priceCents: number
    // null = sem limite por item.
    maxQuantity: number | null
}

export type OptionGroup = {
    id: string
    title: string
    minChoices: number
    // null = sem limite de unidades no grupo.
    maxChoices: number | null
    options: ProductOption[]
}

export type Product = {
    id: string
    categoryId: string
    name: string
    description: string | null
    priceCents: number
    promoPriceCents: number | null
    serves: number | null
    portionLabel: string | null
    imageUrl: string | null
    featured: boolean
    active: boolean
    // null = sem controle de estoque.
    stock: number | null
    sellsDeliveryPickup: boolean
    optionGroups: OptionGroup[]
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
