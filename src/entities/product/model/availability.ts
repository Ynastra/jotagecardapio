import type { Product } from './types'

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
