import { supabase } from '@/shared/api'

import type { ProductOptionLink, ProductValues } from '../model/types'

export type PositionedTable = 'categories' | 'products'

export type PositionUpdate = { id: string; position: number }

const FEATURED_LIMIT_CODE = 'featured_limit_reached'

function throwOnError(error: Error | null) {
    if (error) {
        throw error
    }
}

export function isFeaturedLimitError(error: unknown): boolean {
    const isLimit = error instanceof Error && error.message.includes(FEATURED_LIMIT_CODE)
    return isLimit
}

function buildProductColumns(values: ProductValues) {
    const columns = {
        category_id: values.categoryId,
        name: values.name,
        description: values.description,
        price_cents: values.priceCents,
        promo_price_cents: values.promoPriceCents,
        serves: values.serves,
        portion_amount: values.portionAmount,
        portion_unit: values.portionUnit,
        image_url: values.imageUrl,
        highlight_tag: values.highlightTag,
        info_tags: values.infoTags,
        allergen_tags: values.allergenTags,
        stock: values.stock,
        sell_delivery_pickup: values.sellsDeliveryPickup,
        sell_table: values.sellsTable,
        featured: values.featured,
        active: values.active,
    }
    return columns
}

export async function createProduct(
    storeId: string,
    values: ProductValues,
    position: number,
    links: readonly ProductOptionLink[],
): Promise<void> {
    const { data, error } = await supabase
        .from('products')
        .insert({ store_id: storeId, position, ...buildProductColumns(values) })
        .select('id')
        .single()
    throwOnError(error)

    if (!data || links.length === 0) {
        return
    }

    const rows = links.map((link) => ({
        store_id: storeId,
        product_id: data.id,
        group_id: link.groupId,
        position: link.position,
        min_choices: link.minChoices,
        max_choices: link.maxChoices,
    }))
    const { error: linkError } = await supabase.from('product_option_groups').insert(rows)
    if (linkError) {
        await supabase.from('products').delete().eq('id', data.id)
        throw linkError
    }
}

export async function setProductPrice(productId: string, priceCents: number): Promise<void> {
    const { error } = await supabase.from('products').update({ price_cents: priceCents }).eq('id', productId)
    throwOnError(error)
}

export async function setProductPromoPrice(productId: string, promoPriceCents: number | null): Promise<void> {
    const { error } = await supabase.from('products').update({ promo_price_cents: promoPriceCents }).eq('id', productId)
    throwOnError(error)
}

export async function setProductActive(productId: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ active }).eq('id', productId)
    throwOnError(error)
}

export async function setProductFeatured(productId: string, featured: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ featured }).eq('id', productId)
    throwOnError(error)
}

export async function deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    throwOnError(error)
}

export async function createCategory(storeId: string, name: string, position: number): Promise<void> {
    const { error } = await supabase.from('categories').insert({ store_id: storeId, name, position })
    throwOnError(error)
}

export async function renameCategory(categoryId: string, name: string): Promise<void> {
    const { error } = await supabase.from('categories').update({ name }).eq('id', categoryId)
    throwOnError(error)
}

export async function setCategoryActive(categoryId: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('categories').update({ active }).eq('id', categoryId)
    throwOnError(error)
}

export async function deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId)
    throwOnError(error)
}

export async function savePositions(table: PositionedTable, updates: readonly PositionUpdate[]): Promise<void> {
    const results = await Promise.all(
        updates.map((update) => supabase.from(table).update({ position: update.position }).eq('id', update.id)),
    )
    for (const result of results) {
        throwOnError(result.error)
    }
}
