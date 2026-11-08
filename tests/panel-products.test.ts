import { describe, expect, it } from 'vitest'

import type { ManagedProduct } from '@/entities/product'
import {
    buildCatalog,
    CATEGORY_NOT_EMPTY_MESSAGE,
    filterCatalogBySearch,
    getCategoryDeletionBlock,
    selectFeatured,
} from '@/pages/panel-products/model/catalog'
import { buildProductCopy, COPY_SUFFIX, PRODUCT_NAME_MAX } from '@/pages/panel-products/model/duplicate'
import { planMove } from '@/pages/panel-products/model/ordering'
import {
    formatPriceText,
    INVALID_PRICE_MESSAGE,
    PRICE_BELOW_PROMO_MESSAGE,
    PROMO_ABOVE_PRICE_MESSAGE,
    resolvePriceEdit,
    resolvePromoEdit,
} from '@/pages/panel-products/model/price-edit'

function buildProduct(overrides: Partial<ManagedProduct> = {}): ManagedProduct {
    return {
        id: 'product-1',
        categoryId: 'category-1',
        name: 'X-Burger',
        description: 'Pão, carne e queijo',
        priceCents: 2500,
        promoPriceCents: 2000,
        serves: 2,
        portionAmount: 300,
        portionUnit: 'g',
        imageUrl: 'https://cdn.example/x-burger.webp',
        highlightTag: 'best_seller',
        infoTags: ['hot_dish'],
        allergenTags: ['contains_gluten'],
        stock: 10,
        sellsDeliveryPickup: true,
        sellsTable: false,
        featured: true,
        active: true,
        position: 3,
        optionLinks: [{ groupId: 'group-1', position: 0, minChoices: 1, maxChoices: 3 }],
        ...overrides,
    }
}

describe('duplicação de produto', () => {
    it('copia os campos do produto e os vínculos de adicionais', () => {
        const product = buildProduct()

        const copy = buildProductCopy(product, 7)

        expect(copy.values).toMatchObject({
            categoryId: 'category-1',
            description: 'Pão, carne e queijo',
            priceCents: 2500,
            promoPriceCents: 2000,
            serves: 2,
            portionAmount: 300,
            portionUnit: 'g',
            highlightTag: 'best_seller',
            infoTags: ['hot_dish'],
            allergenTags: ['contains_gluten'],
            stock: 10,
            sellsDeliveryPickup: true,
            sellsTable: false,
        })
        expect(copy.links).toEqual(product.optionLinks)
        expect(copy.position).toBe(7)
    })

    it('mantém a mesma imagem', () => {
        const copy = buildProductCopy(buildProduct(), 0)

        expect(copy.values.imageUrl).toBe('https://cdn.example/x-burger.webp')
    })

    it('acrescenta (cópia) ao nome', () => {
        const copy = buildProductCopy(buildProduct(), 0)

        expect(copy.values.name).toBe('X-Burger (cópia)')
    })

    it('mantém o nome dentro do limite do banco', () => {
        const copy = buildProductCopy(buildProduct({ name: 'a'.repeat(PRODUCT_NAME_MAX) }), 0)

        expect(copy.values.name).toHaveLength(PRODUCT_NAME_MAX)
        expect(copy.values.name.endsWith(COPY_SUFFIX)).toBe(true)
    })

    it('nasce desativada e fora dos destaques', () => {
        const copy = buildProductCopy(buildProduct({ active: true, featured: true }), 0)

        expect(copy.values.active).toBe(false)
        expect(copy.values.featured).toBe(false)
    })

    it('não compartilha as listas com o original', () => {
        const product = buildProduct()

        const copy = buildProductCopy(product, 0)
        copy.values.infoTags.push('vegan')
        copy.links[0].minChoices = 0

        expect(product.infoTags).toEqual(['hot_dish'])
        expect(product.optionLinks[0].minChoices).toBe(1)
    })
})

describe('edição de preço na linha', () => {
    it('lê o texto digitado em reais', () => {
        expect(resolvePriceEdit('30,50', buildProduct())).toEqual({ kind: 'change', value: 3050 })
    })

    it('não grava quando o valor não mudou', () => {
        expect(resolvePriceEdit('25,00', buildProduct())).toEqual({ kind: 'unchanged' })
    })

    it('recusa texto que não é número', () => {
        expect(resolvePriceEdit('abc', buildProduct())).toEqual({ kind: 'invalid', error: INVALID_PRICE_MESSAGE })
        expect(resolvePriceEdit('', buildProduct())).toEqual({ kind: 'invalid', error: INVALID_PRICE_MESSAGE })
    })

    it('recusa preço igual ou abaixo do desconto', () => {
        const product = buildProduct({ promoPriceCents: 2000 })

        expect(resolvePriceEdit('20,00', product)).toEqual({ kind: 'invalid', error: PRICE_BELOW_PROMO_MESSAGE })
        expect(resolvePriceEdit('15,00', product)).toEqual({ kind: 'invalid', error: PRICE_BELOW_PROMO_MESSAGE })
    })

    it('aceita qualquer preço quando não há desconto', () => {
        const product = buildProduct({ promoPriceCents: null })

        expect(resolvePriceEdit('1,00', product)).toEqual({ kind: 'change', value: 100 })
    })

    it('formata o valor salvo no formato que o campo lê', () => {
        expect(formatPriceText(2590)).toBe('25,90')
        expect(resolvePriceEdit(formatPriceText(2590), buildProduct({ priceCents: 2590 }))).toEqual({
            kind: 'unchanged',
        })
    })
})

describe('edição de desconto na linha', () => {
    it('grava o desconto abaixo do preço', () => {
        const product = buildProduct({ promoPriceCents: null })

        expect(resolvePromoEdit('19,90', product)).toEqual({ kind: 'change', value: 1990 })
    })

    it('recusa desconto igual ou acima do preço, com o erro para a linha', () => {
        const product = buildProduct({ priceCents: 2500 })

        expect(resolvePromoEdit('25,00', product)).toEqual({ kind: 'invalid', error: PROMO_ABOVE_PRICE_MESSAGE })
        expect(resolvePromoEdit('30,00', product)).toEqual({ kind: 'invalid', error: PROMO_ABOVE_PRICE_MESSAGE })
    })

    it('campo vazio remove o desconto existente', () => {
        expect(resolvePromoEdit('  ', buildProduct({ promoPriceCents: 2000 }))).toEqual({ kind: 'change', value: null })
    })

    it('campo vazio sem desconto não muda nada', () => {
        expect(resolvePromoEdit('', buildProduct({ promoPriceCents: null }))).toEqual({ kind: 'unchanged' })
    })

    it('aceita desconto zero', () => {
        expect(resolvePromoEdit('0', buildProduct({ promoPriceCents: null }))).toEqual({ kind: 'change', value: 0 })
    })

    it('recusa texto que não é número', () => {
        expect(resolvePromoEdit('xx', buildProduct())).toEqual({ kind: 'invalid', error: INVALID_PRICE_MESSAGE })
    })
})

describe('exclusão de categoria', () => {
    const categories = [
        { id: 'category-1', name: 'Lanches', active: true, position: 0 },
        { id: 'category-2', name: 'Bebidas', active: true, position: 1 },
    ]

    it('só vale para categoria vazia', () => {
        const catalog = buildCatalog(categories, [buildProduct({ categoryId: 'category-1' })])

        expect(getCategoryDeletionBlock(catalog[0])).toBe(CATEGORY_NOT_EMPTY_MESSAGE)
        expect(getCategoryDeletionBlock(catalog[1])).toBeNull()
    })
})

describe('catálogo do painel', () => {
    const categories = [
        { id: 'category-2', name: 'Bebidas', active: true, position: 1 },
        { id: 'category-1', name: 'Lanches', active: true, position: 0 },
    ]

    it('ordena categorias e produtos pela posição', () => {
        const products = [
            buildProduct({ id: 'b', position: 1 }),
            buildProduct({ id: 'a', position: 0 }),
            buildProduct({ id: 'c', categoryId: 'category-2', position: 0 }),
        ]

        const catalog = buildCatalog(categories, products)

        expect(catalog.map((category) => category.id)).toEqual(['category-1', 'category-2'])
        expect(catalog[0].products.map((product) => product.id)).toEqual(['a', 'b'])
    })

    it('busca pelo nome, sem acento nem caixa, e esconde blocos sem resultado', () => {
        const products = [
            buildProduct({ id: 'a', name: 'Pão de queijo' }),
            buildProduct({ id: 'b', categoryId: 'category-2', name: 'Suco' }),
        ]
        const catalog = buildCatalog(categories, products)

        const filtered = filterCatalogBySearch(catalog, 'PAO')

        expect(filtered.map((category) => category.id)).toEqual(['category-1'])
        expect(filtered[0].products.map((product) => product.id)).toEqual(['a'])
    })

    it('lista só os destaques', () => {
        const products = [buildProduct({ id: 'a', featured: false }), buildProduct({ id: 'b', featured: true })]

        expect(selectFeatured(products).map((product) => product.id)).toEqual(['b'])
    })
})

describe('ordem dos produtos', () => {
    it('troca o produto com o vizinho de cima', () => {
        const items = [
            { id: 'a', position: 0 },
            { id: 'b', position: 1 },
        ]

        expect(planMove(items, 'b', 'up')).toEqual([
            { id: 'b', position: 0 },
            { id: 'a', position: 1 },
        ])
    })

    it('não muda nada no primeiro subindo', () => {
        expect(planMove([{ id: 'a', position: 0 }], 'a', 'up')).toEqual([])
    })
})
