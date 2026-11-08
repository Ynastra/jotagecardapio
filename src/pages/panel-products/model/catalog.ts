import type { ManagedCategory, ManagedProduct } from '@/entities/product'

import { sortByPosition } from './ordering'

export const MAX_FEATURED = 6
export const FEATURED_LIMIT_MESSAGE = `Máximo de ${MAX_FEATURED} destaques`
export const CATEGORY_NOT_EMPTY_MESSAGE = 'Mova ou exclua os produtos desta categoria antes'

export type CatalogCategory = ManagedCategory & { products: ManagedProduct[] }

function normalizeSearchText(text: string): string {
    const withoutAccents = text.normalize('NFD').replace(/[̀-ͯ]/g, '')
    const normalized = withoutAccents.toLowerCase().trim()
    return normalized
}

export function buildCatalog(
    categories: readonly ManagedCategory[],
    products: readonly ManagedProduct[],
): CatalogCategory[] {
    const catalog = sortByPosition(categories).map((category) => ({
        ...category,
        products: sortByPosition(products.filter((product) => product.categoryId === category.id)),
    }))
    return catalog
}

// Com busca, só ficam os blocos que têm produto com o termo no nome.
export function filterCatalogBySearch(catalog: readonly CatalogCategory[], search: string): CatalogCategory[] {
    const term = normalizeSearchText(search)
    if (term === '') {
        return [...catalog]
    }

    const filtered = catalog
        .map((category) => ({
            ...category,
            products: category.products.filter((product) => normalizeSearchText(product.name).includes(term)),
        }))
        .filter((category) => category.products.length > 0)
    return filtered
}

export function selectFeatured(products: readonly ManagedProduct[]): ManagedProduct[] {
    const featured = sortByPosition(products.filter((product) => product.featured))
    return featured
}

// Excluir categoria só vale vazia: com produtos, o banco apagaria todos em cascata.
export function getCategoryDeletionBlock(category: Pick<CatalogCategory, 'products'>): string | null {
    const block = category.products.length > 0 ? CATEGORY_NOT_EMPTY_MESSAGE : null
    return block
}

export function describeItemCount(itemCount: number): string {
    const noun = itemCount === 1 ? 'item' : 'itens'
    const description = `${itemCount} ${noun}`
    return description
}

export function describeServes(serves: number): string {
    const noun = serves === 1 ? 'pessoa' : 'pessoas'
    const description = `Serve ${serves} ${noun}`
    return description
}
