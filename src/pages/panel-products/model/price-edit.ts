import type { ManagedProduct } from '@/entities/product'
import { parseReaisToCents } from '@/shared/lib'

type PricedProduct = Pick<ManagedProduct, 'priceCents' | 'promoPriceCents'>

export type PriceEdit<Value> =
    | { kind: 'change'; value: Value }
    | { kind: 'unchanged' }
    | { kind: 'invalid'; error: string }

export const INVALID_PRICE_MESSAGE = 'Informe um preço válido'
export const PROMO_ABOVE_PRICE_MESSAGE = 'O desconto tem que ficar abaixo do preço'
export const PRICE_BELOW_PROMO_MESSAGE = 'O preço tem que ficar acima do desconto'

const CENTS_PER_REAL = 100

// Texto do campo para um valor salvo, no formato que parseReaisToCents lê.
export function formatPriceText(cents: number): string {
    const text = (cents / CENTS_PER_REAL).toFixed(2).replace('.', ',')
    return text
}

export function resolvePriceEdit(text: string, product: PricedProduct): PriceEdit<number> {
    const cents = parseReaisToCents(text)

    if (cents === null) {
        return { kind: 'invalid', error: INVALID_PRICE_MESSAGE }
    }
    if (product.promoPriceCents !== null && cents <= product.promoPriceCents) {
        return { kind: 'invalid', error: PRICE_BELOW_PROMO_MESSAGE }
    }
    if (cents === product.priceCents) {
        return { kind: 'unchanged' }
    }

    return { kind: 'change', value: cents }
}

// Campo vazio remove o desconto.
export function resolvePromoEdit(text: string, product: PricedProduct): PriceEdit<number | null> {
    if (text.trim() === '') {
        return product.promoPriceCents === null ? { kind: 'unchanged' } : { kind: 'change', value: null }
    }

    const cents = parseReaisToCents(text)

    if (cents === null) {
        return { kind: 'invalid', error: INVALID_PRICE_MESSAGE }
    }
    if (cents >= product.priceCents) {
        return { kind: 'invalid', error: PROMO_ABOVE_PRICE_MESSAGE }
    }
    if (cents === product.promoPriceCents) {
        return { kind: 'unchanged' }
    }

    return { kind: 'change', value: cents }
}
