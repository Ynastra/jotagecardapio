import { supabase } from '@/shared/api'

import type { AllergenTag, HighlightTag, InfoTag, PortionUnit } from '../model/tags'
import type { ManagedCategory, ManagedProduct } from '../model/types'

type ProductRow = {
    id: string
    category_id: string
    name: string
    description: string | null
    price_cents: number
    promo_price_cents: number | null
    serves: number | null
    portion_amount: number | null
    portion_unit: PortionUnit | null
    image_url: string | null
    highlight_tag: HighlightTag | null
    info_tags: InfoTag[]
    allergen_tags: AllergenTag[]
    stock: number | null
    sell_delivery_pickup: boolean
    sell_table: boolean
    featured: boolean
    active: boolean
    position: number
    product_option_groups: { group_id: string; position: number; min_choices: number; max_choices: number | null }[]
}

type CategoryRow = { id: string; name: string; active: boolean; position: number }

export type Catalog = {
    categories: ManagedCategory[]
    products: ManagedProduct[]
}

const PRODUCT_COLUMNS =
    'id, category_id, name, description, price_cents, promo_price_cents, serves, portion_amount, portion_unit, image_url, highlight_tag, info_tags, allergen_tags, stock, sell_delivery_pickup, sell_table, featured, active, position, product_option_groups(group_id, position, min_choices, max_choices)'

function mapProduct(row: ProductRow): ManagedProduct {
    const product = {
        id: row.id,
        categoryId: row.category_id,
        name: row.name,
        description: row.description,
        priceCents: row.price_cents,
        promoPriceCents: row.promo_price_cents,
        serves: row.serves,
        portionAmount: row.portion_amount,
        portionUnit: row.portion_unit,
        imageUrl: row.image_url,
        highlightTag: row.highlight_tag,
        infoTags: row.info_tags,
        allergenTags: row.allergen_tags,
        stock: row.stock,
        sellsDeliveryPickup: row.sell_delivery_pickup,
        sellsTable: row.sell_table,
        featured: row.featured,
        active: row.active,
        position: row.position,
        optionLinks: row.product_option_groups.map((link) => ({
            groupId: link.group_id,
            position: link.position,
            minChoices: link.min_choices,
            maxChoices: link.max_choices,
        })),
    }
    return product
}

export async function fetchCatalog(storeId: string): Promise<Catalog> {
    const [categories, products] = await Promise.all([
        supabase.from('categories').select('id, name, active, position').eq('store_id', storeId),
        supabase.from('products').select(PRODUCT_COLUMNS).eq('store_id', storeId),
    ])

    if (categories.error) {
        throw categories.error
    }
    if (products.error) {
        throw products.error
    }

    const catalog = {
        categories: (categories.data as CategoryRow[]).map((row) => ({ ...row })),
        products: (products.data as unknown as ProductRow[]).map(mapProduct),
    }
    return catalog
}
