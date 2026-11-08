import { describe, expect, it } from 'vitest'

import { getContrastRatio, isHexColor, pickReadableTextColor } from '@/shared/lib'

describe('getContrastRatio', () => {
    it('devolve 21 entre preto e branco e 1 entre cores iguais', () => {
        expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
        expect(getContrastRatio('#336699', '#336699')).toBeCloseTo(1, 5)
    })

    it('não depende da ordem das cores', () => {
        expect(getContrastRatio('#041f4a', '#ffffff')).toBeCloseTo(getContrastRatio('#ffffff', '#041f4a'), 10)
    })

    it('dá a razão do texto escolhido sobre a cor da marca', () => {
        const brand = '#060504'
        const ratio = getContrastRatio(pickReadableTextColor(brand), brand)

        expect(ratio).toBeGreaterThan(15)
    })

    it('mostra contraste baixo de uma cor clara contra o fundo claro da página', () => {
        expect(getContrastRatio('#f0e68c', '#f6f3ef')).toBeLessThan(3)
    })
})

describe('isHexColor', () => {
    it('aceita só # com seis dígitos hexadecimais', () => {
        expect(isHexColor('#0178da')).toBe(true)
        expect(isHexColor('#0178DA')).toBe(true)
        expect(isHexColor('0178da')).toBe(false)
        expect(isHexColor('#017')).toBe(false)
        expect(isHexColor('#01g8da')).toBe(false)
    })
})
