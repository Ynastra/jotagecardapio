import { describe, expect, it } from 'vitest'

import { pickFeaturedHero } from '@/pages/store-menu/model/featured-hero'
import type { Product } from '@/pages/store-menu/model/types'

const PHOTO = 'https://example.com/foto.webp'

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

describe('pickFeaturedHero', () => {
    it('usa o produto preferido da loja quando ele está em destaque e disponível', () => {
        const products = [
            buildProduct({ id: 'a', name: 'X-Bacon', featured: true, imageUrl: PHOTO }),
            buildProduct({ id: 'b', name: 'X-CHICKEN', featured: true, imageUrl: PHOTO }),
        ]

        const hero = pickFeaturedHero('zedoburguerlucelia', products)

        expect(hero?.product.id).toBe('b')
        expect(hero?.hasPhoto).toBe(true)
    })

    it('casa o nome preferido ignorando caixa e acento', () => {
        const products = [
            buildProduct({ id: 'a', name: 'X-Bacon', featured: true, imageUrl: PHOTO }),
            buildProduct({ id: 'b', name: 'x-chicken', featured: true }),
        ]

        const hero = pickFeaturedHero('zedoburguerlucelia', products)

        expect(hero?.product.id).toBe('b')
        expect(hero?.hasPhoto).toBe(false)
    })

    it('cai no primeiro destaque com foto quando o preferido não está em destaque', () => {
        const products = [
            buildProduct({ id: 'a', name: 'X-Bacon', featured: true }),
            buildProduct({ id: 'b', name: 'X-Salada', featured: true, imageUrl: PHOTO }),
            buildProduct({ id: 'c', name: 'X-Chicken', featured: false, imageUrl: PHOTO }),
        ]

        const hero = pickFeaturedHero('zedoburguerlucelia', products)

        expect(hero?.product.id).toBe('b')
    })

    it('ignora a preferência editorial de outra loja', () => {
        const products = [
            buildProduct({ id: 'a', name: 'X-Bacon', featured: true, imageUrl: PHOTO }),
            buildProduct({ id: 'b', name: 'X-Chicken', featured: true, imageUrl: PHOTO }),
        ]

        const hero = pickFeaturedHero('outraloja', products)

        expect(hero?.product.id).toBe('a')
    })

    it('usa o primeiro destaque sem foto quando nenhum tem foto', () => {
        const products = [
            buildProduct({ id: 'a', name: 'Suco', featured: true }),
            buildProduct({ id: 'b', name: 'Água', featured: true }),
        ]

        const hero = pickFeaturedHero('outraloja', products)

        expect(hero?.product.id).toBe('a')
        expect(hero?.hasPhoto).toBe(false)
    })

    it('devolve nulo quando nenhum produto está em destaque', () => {
        const products = [buildProduct({ id: 'a', imageUrl: PHOTO })]

        expect(pickFeaturedHero('zedoburguerlucelia', products)).toBeNull()
    })

    it('ignora destaque indisponível ou esgotado', () => {
        const products = [
            buildProduct({ id: 'a', name: 'X-Chicken', featured: true, imageUrl: PHOTO, active: false }),
            buildProduct({ id: 'b', name: 'X-Bacon', featured: true, imageUrl: PHOTO, stock: 0 }),
            buildProduct({ id: 'c', name: 'X-Salada', featured: true, imageUrl: PHOTO }),
        ]

        const hero = pickFeaturedHero('zedoburguerlucelia', products)

        expect(hero?.product.id).toBe('c')
    })

    it('devolve nulo quando todos os destaques estão indisponíveis', () => {
        const products = [buildProduct({ id: 'a', featured: true, imageUrl: PHOTO, active: false })]

        expect(pickFeaturedHero('outraloja', products)).toBeNull()
    })
})
