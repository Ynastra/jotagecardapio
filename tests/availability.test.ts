import { describe, expect, it } from 'vitest'

import type { DraftLine } from '@/entities/order'
import {
    countProductInCart,
    getMaxQuantity,
    getProductAvailability,
    MAX_ITEM_QUANTITY,
    selectOnlineProducts,
} from '@/pages/store-menu/model/availability'
import type { Product } from '@/pages/store-menu/model/types'

function buildProduct(overrides: Partial<Product>): Product {
    const product: Product = {
        id: 'p',
        categoryId: 'c',
        name: 'Produto',
        description: null,
        priceCents: 1000,
        promoPriceCents: null,
        serves: null,
        portionLabel: null,
        imageUrl: null,
        featured: false,
        active: true,
        stock: null,
        sellsDeliveryPickup: true,
        optionGroups: [],
        ...overrides,
    }
    return product
}

function buildLine(key: string, productId: string, quantity: number): DraftLine {
    const line: DraftLine = { key, productId, name: 'Produto', quantity, unitPriceCents: 1000, notes: '', options: [] }
    return line
}

describe('getProductAvailability', () => {
    it('marca desativado como indisponível', () => {
        expect(getProductAvailability({ active: false, stock: null })).toBe('inactive')
    })

    it('marca estoque zerado como esgotado', () => {
        expect(getProductAvailability({ active: true, stock: 0 })).toBe('soldOut')
    })

    it('mantém disponível com estoque ou sem controle de estoque', () => {
        expect(getProductAvailability({ active: true, stock: 3 })).toBe('available')
        expect(getProductAvailability({ active: true, stock: null })).toBe('available')
    })
})

describe('selectOnlineProducts', () => {
    const onlyDineIn = buildProduct({ id: 'mesa', sellsDeliveryPickup: false })
    const inactive = buildProduct({ id: 'inativo', active: false })
    const soldOut = buildProduct({ id: 'esgotado', stock: 0 })
    const regular = buildProduct({ id: 'normal' })
    const products = [onlyDineIn, inactive, soldOut, regular]

    it('tira o produto só de mesa e o desativado quando a loja oculta indisponíveis', () => {
        const ids = selectOnlineProducts(products, { hideUnavailableItems: true }).map((product) => product.id)

        expect(ids).toEqual(['esgotado', 'normal'])
    })

    it('mantém o desativado quando a loja mostra indisponíveis, mas nunca o só de mesa', () => {
        const ids = selectOnlineProducts(products, { hideUnavailableItems: false }).map((product) => product.id)

        expect(ids).toEqual(['inativo', 'esgotado', 'normal'])
    })

    it('mantém o esgotado mesmo quando a loja oculta indisponíveis', () => {
        const ids = selectOnlineProducts([soldOut], { hideUnavailableItems: true }).map((product) => product.id)

        expect(ids).toEqual(['esgotado'])
    })
})

describe('getMaxQuantity', () => {
    it('usa o limite geral sem controle de estoque', () => {
        expect(getMaxQuantity({ stock: null }, 5)).toBe(MAX_ITEM_QUANTITY)
    })

    it('limita ao estoque descontando o que já está na sacola', () => {
        expect(getMaxQuantity({ stock: 5 }, 2)).toBe(3)
    })

    it('nunca passa do limite geral nem fica negativo', () => {
        expect(getMaxQuantity({ stock: 500 }, 0)).toBe(MAX_ITEM_QUANTITY)
        expect(getMaxQuantity({ stock: 2 }, 4)).toBe(0)
    })
})

describe('countProductInCart', () => {
    const lines = [buildLine('a', 'p', 2), buildLine('b', 'p', 1), buildLine('c', 'outro', 4)]

    it('soma as linhas do mesmo produto', () => {
        expect(countProductInCart(lines, 'p')).toBe(3)
    })

    it('ignora a linha informada', () => {
        expect(countProductInCart(lines, 'p', 'a')).toBe(1)
    })
})
