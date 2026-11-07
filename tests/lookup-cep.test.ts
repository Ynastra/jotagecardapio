import { afterEach, describe, expect, it, vi } from 'vitest'

import { lookupCep } from '@/pages/store-menu/api/lookup-cep'
import { formatCep, isValidCep } from '@/shared/lib'

const VIACEP_URL = 'https://viacep.com.br/ws/17780000/json/'
const BRASIL_API_URL = 'https://brasilapi.com.br/api/cep/v2/17780000'

type FakeResponse = { ok: boolean; json: () => Promise<unknown> }

function jsonResponse(body: unknown): FakeResponse {
    return { ok: true, json: async () => body }
}

const failedResponse: FakeResponse = { ok: false, json: async () => ({}) }

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<FakeResponse>) {
    const fetchMock = vi.fn(handler)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

const viaCepFound = jsonResponse({ logradouro: 'Rua A', bairro: 'Centro', localidade: 'Lucélia', uf: 'SP' })
const brasilApiFound = jsonResponse({ street: 'Rua B', neighborhood: 'Lado Este', city: 'Lucélia', state: 'SP' })

afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
})

describe('lookupCep', () => {
    it('devolve o endereço do ViaCEP e não consulta a BrasilAPI', async () => {
        const fetchMock = stubFetch(async () => viaCepFound)

        const address = await lookupCep('17780-000')

        expect(address).toEqual({ street: 'Rua A', neighborhood: 'Centro', city: 'Lucélia', state: 'SP' })
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(fetchMock).toHaveBeenCalledWith(VIACEP_URL, expect.anything())
    })

    it('usa a BrasilAPI quando o ViaCEP não acha o CEP', async () => {
        stubFetch(async (url) => (url === VIACEP_URL ? jsonResponse({ erro: true }) : brasilApiFound))

        const address = await lookupCep('17780000')

        expect(address).toEqual({ street: 'Rua B', neighborhood: 'Lado Este', city: 'Lucélia', state: 'SP' })
    })

    it('usa a BrasilAPI quando o ViaCEP falha e trata campos nulos como vazios', async () => {
        stubFetch(async (url) => {
            if (url === VIACEP_URL) {
                throw new TypeError('Failed to fetch')
            }
            return jsonResponse({ street: null, neighborhood: null, city: 'Lucélia', state: 'SP' })
        })

        const address = await lookupCep('17780000')

        expect(address).toEqual({ street: '', neighborhood: '', city: 'Lucélia', state: 'SP' })
    })

    it('devolve nada quando as duas fontes não acham o CEP', async () => {
        stubFetch(async (url) => (url === VIACEP_URL ? jsonResponse({ erro: true }) : failedResponse))

        expect(await lookupCep('17780000')).toBeNull()
    })

    it('devolve nada quando as duas fontes falham na rede', async () => {
        stubFetch(async () => {
            throw new TypeError('Failed to fetch')
        })

        expect(await lookupCep('17780000')).toBeNull()
    })

    it('desiste de uma fonte que não responde em 8 segundos', async () => {
        vi.useFakeTimers()
        const fetchMock = stubFetch(
            (_url, init) =>
                new Promise<FakeResponse>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
                }),
        )

        const pending = lookupCep('17780000')
        await vi.advanceTimersByTimeAsync(8000)
        await vi.advanceTimersByTimeAsync(8000)

        expect(await pending).toBeNull()
        expect(fetchMock).toHaveBeenCalledWith(BRASIL_API_URL, expect.anything())
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
