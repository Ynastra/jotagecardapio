import { describe, expect, it } from 'vitest'

import { buildStoreImagePath } from '@/shared/api/upload-store-image'
import { computeOutputSize, validateImageFile } from '@/shared/lib'

const TEN_MEGABYTES = 10 * 1024 * 1024

describe('validateImageFile', () => {
    it.each(['image/jpeg', 'image/png', 'image/webp'])('aceita %s', (type) => {
        expect(validateImageFile({ type, size: 1000 })).toBeNull()
    })

    it('recusa tipo fora de JPEG, PNG e WebP', () => {
        expect(validateImageFile({ type: 'image/gif', size: 1000 })).toBe('Use uma imagem JPEG, PNG ou WebP')
        expect(validateImageFile({ type: 'application/pdf', size: 1000 })).not.toBeNull()
    })

    it('aceita exatamente 10 MB e recusa acima disso', () => {
        expect(validateImageFile({ type: 'image/png', size: TEN_MEGABYTES })).toBeNull()
        expect(validateImageFile({ type: 'image/png', size: TEN_MEGABYTES + 1 })).toBe(
            'A imagem deve ter no máximo 10 MB',
        )
    })
})

describe('computeOutputSize', () => {
    it('mantém imagem que já cabe no limite', () => {
        expect(computeOutputSize(800, 600)).toEqual({ width: 800, height: 600 })
        expect(computeOutputSize(1200, 1200)).toEqual({ width: 1200, height: 1200 })
    })

    it('reduz o lado maior para 1200 mantendo a proporção', () => {
        expect(computeOutputSize(2400, 1200)).toEqual({ width: 1200, height: 600 })
        expect(computeOutputSize(3000, 4000)).toEqual({ width: 900, height: 1200 })
    })

    it('nunca devolve lado zero', () => {
        expect(computeOutputSize(12000, 1)).toEqual({ width: 1200, height: 1 })
    })
})

describe('buildStoreImagePath', () => {
    it('começa pelo id da loja e termina em webp', () => {
        expect(buildStoreImagePath('loja-1', 'produtos', 'abc')).toBe('loja-1/produtos/abc.webp')
        expect(buildStoreImagePath('loja-1', 'adicionais', 'abc')).toBe('loja-1/adicionais/abc.webp')
    })
})
