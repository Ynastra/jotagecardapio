import { describe, expect, it } from 'vitest'

import { formatNationalPhone } from '@/shared/lib'

describe('formatNationalPhone', () => {
    it('tira o código do país do WhatsApp gravado da loja', () => {
        expect(formatNationalPhone('5518996649346')).toBe('(18) 99664-9346')
    })

    it('mantém o número que já vem sem código do país', () => {
        expect(formatNationalPhone('18996649346')).toBe('(18) 99664-9346')
    })

    it('formata fixo de 10 dígitos com código do país', () => {
        expect(formatNationalPhone('551832221234')).toBe('(18) 3222-1234')
    })
})
