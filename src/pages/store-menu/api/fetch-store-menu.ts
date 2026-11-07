import { supabase } from '@/shared/api'

import { selectOnlineProducts } from '../model/availability'
import type { Category,OptionGroup, Product, Store, StoreMenu } from '../model/types'

const STORE_COLUMNS =
    'id, slug, name, address, whatsapp, logo_url, cover_url, theme, brand_color, min_order_cents, delivery_fee_cents, free_delivery_above_cents, accepts_delivery, accepts_pickup, enforce_opening_hours, timezone, city, state, address_display, require_cep, order_copy_whatsapp, hide_unavailable_items, cart_notice_title, cart_notice_body, pix_key, pix_key_type'

const PORTION_UNIT_LABELS: Record<string, string> = {
    g: 'g',
    kg: 'kg',
    l: 'l',
    ml: 'ml',
    un: 'un',
    capsulas: 'cápsulas',
    fatias: 'fatias',
}

type StoreRow = {
    id: string
    slug: string
    name: string
    address: string | null
    whatsapp: string
    logo_url: string | null
    cover_url: string | null
    theme: string
    brand_color: string | null
    min_order_cents: number
    delivery_fee_cents: number
    free_delivery_above_cents: number | null
    accepts_delivery: boolean
    accepts_pickup: boolean
    enforce_opening_hours: boolean
    timezone: string
    city: string | null
    state: string | null
    address_display: 'hidden' | 'city' | 'full'
    require_cep: boolean
    order_copy_whatsapp: boolean
    hide_unavailable_items: boolean
    cart_notice_title: string | null
    cart_notice_body: string | null
    pix_key: string | null
    pix_key_type: 'cnpj' | 'cpf' | 'email' | 'phone' | 'random' | null
}

type MenuRows = {
    hours: { weekday: number; opens_at: string; closes_at: string }[]
    zones: { id: string; neighborhood: string; fee_cents: number }[]
    paymentMethods: {
        method: Store['paymentMethods'][number]['method']
        enabled_delivery: boolean
        enabled_pickup: boolean
        fee_kind: 'percent' | 'fixed'
        fee_percent: number
        fee_fixed_cents: number
    }[]
    categories: { id: string; name: string; icon_url: string | null }[]
    products: {
        id: string
        category_id: string
        name: string
        description: string | null
        price_cents: number
        promo_price_cents: number | null
        serves: number | null
        portion_amount: number | null
        portion_unit: string | null
        image_url: string | null
        featured: boolean
        active: boolean
        stock: number | null
        sell_delivery_pickup: boolean
    }[]
    links: { product_id: string; group_id: string; min_choices: number; max_choices: number | null }[]
    groups: { id: string; title: string }[]
    options: {
        id: string
        group_id: string
        name: string
        description: string | null
        image_url: string | null
        price_cents: number
        max_quantity: number
    }[]
}

export class MenuLoadError extends Error {}

function unwrap<Row>(result: { data: Row[] | null; error: { message: string } | null }): Row[] {
    if (result.error) {
        throw new MenuLoadError(result.error.message)
    }

    const rows = result.data ?? []
    return rows
}

async function fetchMenuRows(storeId: string): Promise<MenuRows> {
    const [hours, zones, paymentMethods, categories, products, links, groups, options] = await Promise.all([
        supabase.from('store_hours').select('weekday, opens_at, closes_at').eq('store_id', storeId),
        supabase.from('delivery_zones').select('id, neighborhood, fee_cents').eq('store_id', storeId).order('neighborhood'),
        supabase
            .from('store_payment_methods')
            .select('method, enabled_delivery, enabled_pickup, fee_kind, fee_percent, fee_fixed_cents')
            .eq('store_id', storeId),
        supabase.from('categories').select('id, name, icon_url').eq('store_id', storeId).order('position'),
        supabase
            .from('products')
            .select(
                'id, category_id, name, description, price_cents, promo_price_cents, serves, portion_amount, portion_unit, image_url, featured, active, stock, sell_delivery_pickup',
            )
            .eq('store_id', storeId)
            .order('position'),
        supabase
            .from('product_option_groups')
            .select('product_id, group_id, min_choices, max_choices')
            .eq('store_id', storeId)
            .order('position'),
        supabase.from('option_groups').select('id, title').eq('store_id', storeId),
        supabase
            .from('options')
            .select('id, group_id, name, description, image_url, price_cents, max_quantity')
            .eq('store_id', storeId)
            .order('position'),
    ])

    const rows = {
        hours: unwrap(hours),
        zones: unwrap(zones),
        paymentMethods: unwrap(paymentMethods),
        categories: unwrap(categories),
        products: unwrap(products),
        links: unwrap(links),
        groups: unwrap(groups),
        options: unwrap(options),
    }
    return rows
}

function describePortion(amount: number | null, unit: string | null): string | null {
    if (amount === null || unit === null) {
        return null
    }

    const unitLabel = PORTION_UNIT_LABELS[unit] ?? unit
    const description = `${amount.toLocaleString('pt-BR')} ${unitLabel}`
    return description
}

function buildOptionGroup(rows: MenuRows, group: MenuRows['groups'][number], link: MenuRows['links'][number]): OptionGroup {
    const optionGroup = {
        id: group.id,
        title: group.title,
        minChoices: link.min_choices,
        maxChoices: link.max_choices,
        options: rows.options
            .filter((option) => option.group_id === group.id)
            .map((option) => ({
                id: option.id,
                name: option.name,
                description: option.description,
                imageUrl: option.image_url,
                priceCents: option.price_cents,
                maxQuantity: option.max_quantity,
            })),
    }
    return optionGroup
}

function buildProductOptionGroups(rows: MenuRows, productId: string): OptionGroup[] {
    const groupsById = new Map(rows.groups.map((group) => [group.id, group]))
    const optionGroups = rows.links
        .filter((link) => link.product_id === productId)
        .flatMap((link) => {
            const group = groupsById.get(link.group_id)
            return group ? [buildOptionGroup(rows, group, link)] : []
        })
        .filter((group) => group.options.length > 0)
    return optionGroups
}

function buildProducts(rows: MenuRows): Product[] {
    const products = rows.products.map((product) => ({
        id: product.id,
        categoryId: product.category_id,
        name: product.name,
        description: product.description,
        priceCents: product.price_cents,
        promoPriceCents: product.promo_price_cents,
        serves: product.serves,
        portionLabel: describePortion(product.portion_amount, product.portion_unit),
        imageUrl: product.image_url,
        featured: product.featured,
        active: product.active,
        stock: product.stock,
        sellsDeliveryPickup: product.sell_delivery_pickup,
        optionGroups: buildProductOptionGroups(rows, product.id),
    }))
    return products
}

function buildStore(row: StoreRow, rows: MenuRows): Store {
    const store = {
        id: row.id,
        slug: row.slug,
        name: row.name,
        address: row.address,
        whatsapp: row.whatsapp,
        logoUrl: row.logo_url,
        coverUrl: row.cover_url,
        theme: row.theme,
        brandColor: row.brand_color,
        minOrderCents: row.min_order_cents,
        deliveryFeeCents: row.delivery_fee_cents,
        freeDeliveryAboveCents: row.free_delivery_above_cents,
        acceptsDelivery: row.accepts_delivery,
        acceptsPickup: row.accepts_pickup,
        enforceOpeningHours: row.enforce_opening_hours,
        timezone: row.timezone,
        city: row.city,
        state: row.state,
        addressDisplay: row.address_display,
        requireCep: row.require_cep,
        orderCopyWhatsapp: row.order_copy_whatsapp,
        hideUnavailableItems: row.hide_unavailable_items,
        cartNoticeTitle: row.cart_notice_title,
        cartNoticeBody: row.cart_notice_body,
        pixKey: row.pix_key,
        pixKeyType: row.pix_key_type,
        hours: rows.hours.map((range) => ({ weekday: range.weekday, opensAt: range.opens_at, closesAt: range.closes_at })),
        deliveryZones: rows.zones.map((zone) => ({ id: zone.id, neighborhood: zone.neighborhood, feeCents: zone.fee_cents })),
        paymentMethods: rows.paymentMethods.map((payment) => ({
            method: payment.method,
            enabledDelivery: payment.enabled_delivery,
            enabledPickup: payment.enabled_pickup,
            feeKind: payment.fee_kind,
            feePercent: payment.fee_percent,
            feeFixedCents: payment.fee_fixed_cents,
        })),
    }
    return store
}

// null quando o endereço não corresponde a nenhuma loja ativa.
export async function fetchStoreMenu(slug: string): Promise<StoreMenu | null> {
    const { data: storeRow, error } = await supabase.from('stores').select(STORE_COLUMNS).eq('slug', slug).maybeSingle<StoreRow>()

    if (error) {
        throw new MenuLoadError(error.message)
    }
    if (!storeRow) {
        return null
    }

    const rows = await fetchMenuRows(storeRow.id)
    const store = buildStore(storeRow, rows)
    const products = selectOnlineProducts(buildProducts(rows), store)
    const categories: Category[] = rows.categories
        .map((category) => ({
            id: category.id,
            name: category.name,
            iconUrl: category.icon_url,
            products: products.filter((product) => product.categoryId === category.id),
        }))
        .filter((category) => category.products.length > 0)

    const menu = { store, categories }
    return menu
}
