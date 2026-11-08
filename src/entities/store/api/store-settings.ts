import { supabase } from '@/shared/api'

import type {
    AddressDisplay,
    DeliveryMode,
    PixKeyType,
    StoreSettings,
    StoreSettingsPatch,
    StoreSettingsValues,
} from '../model/types'

const COLUMN_BY_FIELD = {
    name: 'name',
    whatsapp: 'whatsapp',
    minOrderCents: 'min_order_cents',
    address: 'address',
    city: 'city',
    state: 'state',
    addressDisplay: 'address_display',
    acceptsDelivery: 'accepts_delivery',
    acceptsPickup: 'accepts_pickup',
    requireCep: 'require_cep',
    orderCopyWhatsapp: 'order_copy_whatsapp',
    hideUnavailableItems: 'hide_unavailable_items',
    cartNoticeTitle: 'cart_notice_title',
    cartNoticeBody: 'cart_notice_body',
    brandColor: 'brand_color',
    logoUrl: 'logo_url',
    coverUrl: 'cover_url',
    prepTimeMinutes: 'prep_time_minutes',
    deliveryMode: 'delivery_mode',
    deliveryFeeCents: 'delivery_fee_cents',
    deliveryMaxKm: 'delivery_max_km',
    freeDeliveryAboveCents: 'free_delivery_above_cents',
    pixKey: 'pix_key',
    pixKeyType: 'pix_key_type',
    latitude: 'latitude',
    longitude: 'longitude',
} as const satisfies Record<keyof StoreSettingsValues, string>

const SETTINGS_COLUMNS = `id, slug, ${Object.values(COLUMN_BY_FIELD).join(', ')}`

type StoreSettingsRow = {
    id: string
    slug: string
    name: string
    whatsapp: string
    min_order_cents: number
    address: string | null
    city: string | null
    state: string | null
    address_display: AddressDisplay
    accepts_delivery: boolean
    accepts_pickup: boolean
    require_cep: boolean
    order_copy_whatsapp: boolean
    hide_unavailable_items: boolean
    cart_notice_title: string | null
    cart_notice_body: string | null
    brand_color: string | null
    logo_url: string | null
    cover_url: string | null
    prep_time_minutes: number
    delivery_mode: DeliveryMode
    delivery_fee_cents: number
    delivery_max_km: number | null
    free_delivery_above_cents: number | null
    pix_key: string | null
    pix_key_type: PixKeyType | null
    latitude: number | string | null
    longitude: number | string | null
}

function toNullableNumber(value: number | string | null): number | null {
    const parsed = value === null ? null : Number(value)
    return parsed
}

function mapSettings(row: StoreSettingsRow): StoreSettings {
    const settings = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        whatsapp: row.whatsapp,
        minOrderCents: row.min_order_cents,
        address: row.address,
        city: row.city,
        state: row.state,
        addressDisplay: row.address_display,
        acceptsDelivery: row.accepts_delivery,
        acceptsPickup: row.accepts_pickup,
        requireCep: row.require_cep,
        orderCopyWhatsapp: row.order_copy_whatsapp,
        hideUnavailableItems: row.hide_unavailable_items,
        cartNoticeTitle: row.cart_notice_title,
        cartNoticeBody: row.cart_notice_body,
        brandColor: row.brand_color,
        logoUrl: row.logo_url,
        coverUrl: row.cover_url,
        prepTimeMinutes: row.prep_time_minutes,
        deliveryMode: row.delivery_mode,
        deliveryFeeCents: row.delivery_fee_cents,
        deliveryMaxKm: row.delivery_max_km === null ? null : Number(row.delivery_max_km),
        freeDeliveryAboveCents: row.free_delivery_above_cents,
        pixKey: row.pix_key,
        pixKeyType: row.pix_key_type,
        latitude: toNullableNumber(row.latitude),
        longitude: toNullableNumber(row.longitude),
    }
    return settings
}

function toSettingsColumns(patch: StoreSettingsPatch): Record<string, unknown> {
    const columns: Record<string, unknown> = {}

    for (const [field, value] of Object.entries(patch)) {
        if (value !== undefined) {
            columns[COLUMN_BY_FIELD[field as keyof StoreSettingsValues]] = value
        }
    }
    return columns
}

export async function fetchStoreSettings(storeId: string): Promise<StoreSettings> {
    const { data, error } = await supabase.from('stores').select(SETTINGS_COLUMNS).eq('id', storeId).single()

    if (error) {
        throw error
    }

    const settings = mapSettings(data as unknown as StoreSettingsRow)
    return settings
}

export async function updateStoreSettings(storeId: string, patch: StoreSettingsPatch): Promise<void> {
    const columns = toSettingsColumns(patch)
    const { error } = await supabase.from('stores').update(columns).eq('id', storeId)

    if (error) {
        throw error
    }
}
