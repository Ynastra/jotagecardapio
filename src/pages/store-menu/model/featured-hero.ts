import { getProductAvailability } from './availability'
import type { Product } from './types'

// Lojas com um lanche de assinatura escolhido à mão, pelo nome normalizado.
const EDITORIAL_PREFERENCE_BY_STORE: Record<string, string> = {
    zedoburguerlucelia: 'x-chicken',
}

export type FeaturedHero = {
    product: Product
    hasPhoto: boolean
}

function normalizeName(name: string): string {
    const normalized = name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()
    return normalized
}

function hasPhoto(product: Product): boolean {
    const photo = Boolean(product.imageUrl)
    return photo
}

export function pickFeaturedHero(storeSlug: string, products: readonly Product[]): FeaturedHero | null {
    const candidates = products.filter((product) => product.featured && getProductAvailability(product) === 'available')

    if (candidates.length === 0) {
        return null
    }

    const preferredName = EDITORIAL_PREFERENCE_BY_STORE[storeSlug]
    const preferred = preferredName
        ? candidates.find((product) => normalizeName(product.name) === preferredName)
        : undefined
    const chosen = preferred ?? candidates.find(hasPhoto) ?? candidates[0]
    const hero = { product: chosen, hasPhoto: hasPhoto(chosen) }
    return hero
}
