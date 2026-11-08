import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api', () => ({ supabase: {} }))

const { isFeaturedLimitError } = await import('@/entities/product/api/write-catalog')

describe('isFeaturedLimitError', () => {
    it('reconhece o objeto simples que o cliente do Supabase devolve', () => {
        expect(isFeaturedLimitError({ message: 'featured_limit_reached', code: 'P0001' })).toBe(true)
    })

    it('reconhece um Error com a mensagem', () => {
        expect(isFeaturedLimitError(new Error('featured_limit_reached'))).toBe(true)
    })

    it('recusa outra mensagem', () => {
        expect(isFeaturedLimitError({ message: 'permission denied' })).toBe(false)
    })

    it('recusa valor nulo e mensagem que não é texto', () => {
        expect(isFeaturedLimitError(null)).toBe(false)
        expect(isFeaturedLimitError({ message: 42 })).toBe(false)
    })
})
