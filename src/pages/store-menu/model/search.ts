import type { Category } from './types'

function normalizeText(text: string): string {
    const normalized = text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
    return normalized
}

// "HAMBÚRGUERES" vira "hamburgueres", o nome do arquivo de ícone da categoria.
export function toAssetStem(name: string): string {
    const stem = normalizeText(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return stem
}

export function filterCategories(categories: readonly Category[], query: string): Category[] {
    const normalizedQuery = normalizeText(query)

    if (!normalizedQuery) {
        const everything = [...categories]
        return everything
    }

    const matches = categories
        .map((category) => ({
            ...category,
            products: category.products.filter((product) =>
                normalizeText(`${product.name} ${product.description ?? ''}`).includes(normalizedQuery),
            ),
        }))
        .filter((category) => category.products.length > 0)
    return matches
}
