import { supabase } from '@/shared/api'

import { diffOptionLinks } from '../model/option-link-diff'
import { buildProductColumns, buildProductUpdateColumns } from '../model/product-columns'
import type { ManagedProduct, ProductOptionLink, ProductValues } from '../model/types'

export type PositionedTable = 'categories' | 'products'

export type PositionUpdate = { id: string; position: number }

const FEATURED_LIMIT_CODE = 'featured_limit_reached'

function throwOnError(error: Error | null) {
    if (error) {
        throw error
    }
}

export function isFeaturedLimitError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('message' in error)) {
        return false
    }

    const { message } = error
    const isLimit = typeof message === 'string' && message.includes(FEATURED_LIMIT_CODE)
    return isLimit
}

function buildOptionLinkRows(storeId: string, productId: string, links: readonly ProductOptionLink[]) {
    const rows = links.map((link) => ({
        store_id: storeId,
        product_id: productId,
        group_id: link.groupId,
        position: link.position,
        min_choices: link.minChoices,
        max_choices: link.maxChoices,
    }))
    return rows
}

async function insertOptionLinks(storeId: string, productId: string, links: readonly ProductOptionLink[]) {
    if (links.length === 0) {
        return
    }

    const rows = buildOptionLinkRows(storeId, productId, links)
    const { error } = await supabase.from('product_option_groups').insert(rows)
    throwOnError(error)
}

// Primeiro grava o que fica ou muda e só depois remove o que saiu: uma falha no
// meio nunca deixa o produto sem adicionais.
async function syncOptionLinks(
    storeId: string,
    productId: string,
    current: readonly ProductOptionLink[],
    desired: readonly ProductOptionLink[],
) {
    const { upserts, removedGroupIds } = diffOptionLinks(current, desired)

    if (upserts.length > 0) {
        const rows = buildOptionLinkRows(storeId, productId, upserts)
        const { error } = await supabase.from('product_option_groups').upsert(rows, { onConflict: 'product_id,group_id' })
        throwOnError(error)
    }

    if (removedGroupIds.length > 0) {
        const { error } = await supabase
            .from('product_option_groups')
            .delete()
            .eq('product_id', productId)
            .in('group_id', removedGroupIds)
        throwOnError(error)
    }
}

// Devolve o id do produto criado.
export async function createProduct(
    storeId: string,
    values: ProductValues,
    position: number,
    links: readonly ProductOptionLink[],
): Promise<string> {
    const { data, error } = await supabase
        .from('products')
        .insert({ store_id: storeId, position, ...buildProductColumns(values) })
        .select('id')
        .single()
    throwOnError(error)

    const productId = (data as { id: string }).id
    try {
        await insertOptionLinks(storeId, productId, links)
    } catch (linkError) {
        await supabase.from('products').delete().eq('id', productId)
        throw linkError
    }
    return productId
}

export async function updateProduct(
    storeId: string,
    loaded: ManagedProduct,
    values: ProductValues,
    position: number,
    links: readonly ProductOptionLink[],
): Promise<void> {
    const columns = buildProductUpdateColumns(values, position, loaded.stock)
    const { error } = await supabase.from('products').update(columns).eq('id', loaded.id)
    throwOnError(error)

    await syncOptionLinks(storeId, loaded.id, loaded.optionLinks, links)
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

// Devolve o id da categoria criada.
export async function createCategory(storeId: string, name: string, position: number): Promise<string> {
    const { data, error } = await supabase
        .from('categories')
        .insert({ store_id: storeId, name, position })
        .select('id')
        .single()
    throwOnError(error)

    const categoryId = (data as { id: string }).id
    return categoryId
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
