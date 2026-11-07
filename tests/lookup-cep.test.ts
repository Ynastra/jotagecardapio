import { afterEach, describe, expect, it, vi } from 'vitest'

import { lookupCep } from '@/pages/store-menu/api/lookup-cep'
import { formatCep, isValidCep } from '@/shared/lib'

function stubFetch(implementation: () => Promise<unknown>) {
    const fetchMock = vi.fn(implementation)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('lookupCep', () => {
    it('devolve rua, bairro, cidade e UF quando o CEP existe', async () => {
        const fetchMock = stubFetch(async () => ({
            ok: true,
            json: async () => ({ logradouro: 'Rua A', bairro: 'Centro', localidade: 'Lucélia', uf: 'SP' }),
        }))

        const address = await lookupCep('17780-000')

        expect(fetchMock).toHaveBeenCalledWith('https://viacep.com.br/ws/17780000/json/')
        expect(address).toEqual({ street: 'Rua A', neighborhood: 'Centro', city: 'Lucélia', state: 'SP' })
    })

    it('devolve nada quando o CEP não é encontrado', async () => {
        stubFetch(async () => ({ ok: true, json: async () => ({ erro: true }) }))

        expect(await lookupCep('00000000')).toBeNull()
    })

    it('devolve nada quando a rede falha', async () => {
        stubFetch(async () => {
            throw new TypeError('Failed to fetch')
        })

        expect(await lookupCep('17780000')).toBeNull()
    })

    it('devolve nada quando o serviço responde com erro', async () => {
        stubFetch(async () => ({ ok: false, json: async () => ({}) }))

        expect(await lookupCep('17780000')).toBeNull()
    })
})

describe('validação e máscara do CEP', () => {
    it('aceita só 8 dígitos', () => {
        expect(isValidCep('17780-000')).toBe(true)
        expect(isValidCep('1778-000')).toBe(false)
    })

    it('formata enquanto digita', () => {
        expect(formatCep('17780')).toBe('17780')
        expect(formatCep('17780000')).toBe('17780-000')
        expect(formatCep('1778000099')).toBe('17780-000')
    })
})
