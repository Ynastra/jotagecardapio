import type { DraftLine } from '@/entities/order'

import type { Product, Store } from './types'

export const MAX_ITEM_QUANTITY = 99

export type ProductAvailability = 'available' | 'inactive' | 'soldOut'

export function getProductAvailability(product: Pick<Product, 'active' | 'stock'>): ProductAvailability {
    if (!product.active) {
        return 'inactive'
    }

    if (product.stock === 0) {
        return 'soldOut'
    }

    return 'available'
}

// Produto só de mesa nunca entra no cardápio online; produto desativado só
// aparece quando a loja escolheu mostrar indisponíveis.
export function selectOnlineProducts(products: readonly Product[], store: Pick<Store, 'hideUnavailableItems'>): Product[] {
    const online = products.filter((product) => {
        const hiddenByStore = !product.active && store.hideUnavailableItems
        const keep = product.sellsDeliveryPickup && !hiddenByStore
        return keep
    })
    return online
}

export function countProductInCart(lines: readonly DraftLine[], productId: string, ignoredKey?: string): number {
    const count = lines
        .filter((line) => line.productId === productId && line.key !== ignoredKey)
        .reduce((total, line) => total + line.quantity, 0)
    return count
}

// quantityElsewhere: unidades do mesmo produto que já estão em outras linhas da sacola.
export function getMaxQuantity(product: Pick<Product, 'stock'>, quantityElsewhere: number): number {
    if (product.stock === null) {
        return MAX_ITEM_QUANTITY
    }

    const remaining = product.stock - quantityElsewhere
    const capped = Math.min(MAX_ITEM_QUANTITY, remaining)
    const max = Math.max(0, capped)
    return max
}
