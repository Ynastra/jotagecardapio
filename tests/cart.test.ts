import { describe, expect, it } from 'vitest'

import type { DraftLine } from '@/entities/order'
import { cartReducer, countItems, getSubtotalCents, keepAvailableLines } from '@/pages/store-menu/model/cart'

function buildLine(overrides: Partial<DraftLine>): DraftLine {
    const line = {
        key: 'linha-1',
        productId: 'x-bacon',
        name: 'X-BACON',
        quantity: 1,
        unitPriceCents: 3399,
        notes: '',
        options: [{ optionId: 'ao-ponto', name: 'Ao ponto', quantity: 1, priceCents: 0 }],
        ...overrides,
    }
    return line
}

describe('cartReducer', () => {
    it('junta itens iguais numa linha só', () => {
        const once = cartReducer([], { type: 'add', line: buildLine({}) })
        const twice = cartReducer(once, { type: 'add', line: buildLine({ key: 'linha-2', quantity: 2 }) })

        expect(twice).toHaveLength(1)
        expect(twice[0].quantity).toBe(3)
    })

    it('separa itens com observação diferente', () => {
        const once = cartReducer([], { type: 'add', line: buildLine({}) })
        const withNote = cartReducer(once, { type: 'add', line: buildLine({ key: 'linha-2', notes: 'sem cebola' }) })

        expect(withNote).toHaveLength(2)
    })

    it('remove a linha quando a quantidade chega a zero', () => {
        const lines = [buildLine({})]

        expect(cartReducer(lines, { type: 'setQuantity', key: 'linha-1', quantity: 0 })).toEqual([])
    })
})

describe('totais da sacola', () => {
    it('soma subtotal e quantidade de itens', () => {
        const lines = [buildLine({ quantity: 2 }), buildLine({ key: 'linha-2', productId: 'coca', unitPriceCents: 700 })]

        expect(getSubtotalCents(lines)).toBe(3399 * 2 + 700)
        expect(countItems(lines)).toBe(3)
    })

    it('descarta itens que saíram do cardápio', () => {
        const lines = [buildLine({}), buildLine({ key: 'linha-2', productId: 'removido' })]

        expect(keepAvailableLines(lines, new Set(['x-bacon']))).toHaveLength(1)
    })
})
