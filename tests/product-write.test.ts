import { describe, expect, it } from 'vitest'

import type { ProductOptionLink, ProductValues } from '@/entities/product'
import { diffOptionLinks } from '@/entities/product/model/option-link-diff'
import { buildProductUpdateColumns } from '@/entities/product/model/product-columns'

function link(groupId: string, position: number, minChoices = 0, maxChoices: number | null = 1): ProductOptionLink {
    const optionLink = { groupId, position, minChoices, maxChoices }
    return optionLink
}

describe('diffOptionLinks', () => {
    it('não devolve nada quando nada mudou', () => {
        const links = [link('a', 0), link('b', 1)]

        expect(diffOptionLinks(links, [link('a', 0), link('b', 1)])).toEqual({ upserts: [], removedGroupIds: [] })
    })

    it('grava só o vínculo incluído', () => {
        const diff = diffOptionLinks([link('a', 0)], [link('a', 0), link('b', 1)])

        expect(diff).toEqual({ upserts: [link('b', 1)], removedGroupIds: [] })
    })

    it('remove só o vínculo que saiu', () => {
        const diff = diffOptionLinks([link('a', 0), link('b', 1)], [link('a', 0)])

        expect(diff).toEqual({ upserts: [], removedGroupIds: ['b'] })
    })

    it('regrava o vínculo cuja regra mudou', () => {
        expect(diffOptionLinks([link('a', 0, 0, 1)], [link('a', 0, 1, 1)]).upserts).toEqual([link('a', 0, 1, 1)])
        expect(diffOptionLinks([link('a', 0, 0, 1)], [link('a', 0, 0, null)]).upserts).toEqual([
            link('a', 0, 0, null),
        ])
    })

    it('regrava o vínculo cuja ordem mudou', () => {
        const diff = diffOptionLinks([link('a', 0), link('b', 1)], [link('b', 0), link('a', 1)])

        expect(diff.upserts).toEqual([link('b', 0), link('a', 1)])
        expect(diff.removedGroupIds).toEqual([])
    })
})

const values: ProductValues = {
    categoryId: 'categoria-1',
    name: 'X-Burguer',
    description: null,
    priceCents: 2500,
    promoPriceCents: null,
    serves: null,
    portionAmount: null,
    portionUnit: null,
    imageUrl: null,
    highlightTag: null,
    infoTags: [],
    allergenTags: [],
    stock: 10,
    sellsDeliveryPickup: true,
    sellsTable: true,
    featured: false,
    active: true,
}

describe('buildProductUpdateColumns', () => {
    it('deixa o estoque fora do payload quando não mudou', () => {
        const columns = buildProductUpdateColumns(values, 3, 10)

        expect(columns).not.toHaveProperty('stock')
        expect(columns.position).toBe(3)
        expect(columns.name).toBe('X-Burguer')
    })

    it('deixa o estoque fora do payload quando segue sem controle', () => {
        const columns = buildProductUpdateColumns({ ...values, stock: null }, 0, null)

        expect(columns).not.toHaveProperty('stock')
    })

    it('inclui o estoque quando mudou', () => {
        const columns = buildProductUpdateColumns({ ...values, stock: 4 }, 0, 10)

        expect(columns).toHaveProperty('stock', 4)
    })

    it('inclui o estoque quando o dono o esvaziou', () => {
        const columns = buildProductUpdateColumns({ ...values, stock: null }, 0, 10)

        expect(columns).toHaveProperty('stock', null)
    })
})
