import { describe, expect, it } from 'vitest'

import { parseReaisToCents } from '@/shared/lib'

describe('parseReaisToCents', () => {
    it.each([
        ['8.00', 800],
        ['8,5', 850],
        ['1.050,50', 105050],
        ['1.050', 105000],
        ['50', 5000],
        ['R$ 1.050,5', 105050],
    ])('lê "%s" como %i centavos', (text, expected) => {
        expect(parseReaisToCents(text)).toBe(expected)
    })

    it('devolve nulo para valor negativo e para texto sem número', () => {
        expect(parseReaisToCents('-5')).toBeNull()
        expect(parseReaisToCents('abc')).toBeNull()
        expect(parseReaisToCents('')).toBeNull()
    })
})
