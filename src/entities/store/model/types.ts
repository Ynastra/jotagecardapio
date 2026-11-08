export type Store = {
    id: string
    name: string
    slug: string
    timezone: string
    prepTimeMinutes: number
}

export type AddressDisplay = 'hidden' | 'city' | 'full'

export type DeliveryMode = 'fixed' | 'radius' | 'neighborhood'

export type PixKeyType = 'cnpj' | 'cpf' | 'email' | 'phone' | 'random'

export type StoreSettingsValues = {
    name: string
    whatsapp: string
    minOrderCents: number
    address: string | null
    city: string | null
    state: string | null
    addressDisplay: AddressDisplay
    acceptsDelivery: boolean
    acceptsPickup: boolean
    requireCep: boolean
    orderCopyWhatsapp: boolean
    hideUnavailableItems: boolean
    cartNoticeTitle: string | null
    cartNoticeBody: string | null
    brandColor: string | null
    logoUrl: string | null
    coverUrl: string | null
    prepTimeMinutes: number
    deliveryMode: DeliveryMode
    deliveryFeeCents: number
    deliveryMaxKm: number | null
    freeDeliveryAboveCents: number | null
    pixKey: string | null
    pixKeyType: PixKeyType | null
    latitude: number | null
    longitude: number | null
}

// Configurações editáveis da loja; o endereço do cardápio (slug) não muda
// depois de criado, porque os links divulgados quebrariam.
export type StoreSettings = StoreSettingsValues & {
    id: string
    slug: string
}

export type StoreSettingsPatch = Partial<StoreSettingsValues>
