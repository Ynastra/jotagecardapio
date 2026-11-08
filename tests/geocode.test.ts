import { afterEach, describe, expect, it, vi } from 'vitest'

import {
    locateAddress,
    locateByStreet,
    parseBrasilApiCoordinates,
    parseNominatimCoordinates,
} from '@/shared/api/geocode'

type FakeResponse = { ok: boolean; json: () => Promise<unknown> }

function jsonResponse(body: unknown): FakeResponse {
    return { ok: true, json: async () => body }
}

function stubFetch(handler: (url: string) => Promise<FakeResponse>) {
    const fetchMock = vi.fn(handler)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('parseBrasilApiCoordinates', () => {
    it('lê a coordenada em texto', () => {
        const body = { location: { coordinates: { latitude: '-21.72028', longitude: '-51.01889' } } }

        expect(parseBrasilApiCoordinates(body)).toEqual({ latitude: -21.72028, longitude: -51.01889 })
    })

    it('lê a coordenada em número', () => {
        const body = { location: { coordinates: { latitude: -21.7, longitude: -51.0 } } }

        expect(parseBrasilApiCoordinates(body)).toEqual({ latitude: -21.7, longitude: -51 })
    })

    it('devolve nulo com coordenada vazia ou ausente', () => {
        expect(parseBrasilApiCoordinates({ location: { coordinates: {} } })).toBeNull()
        expect(parseBrasilApiCoordinates({ location: { coordinates: { latitude: '', longitude: '' } } })).toBeNull()
        expect(parseBrasilApiCoordinates({ location: {} })).toBeNull()
        expect(parseBrasilApiCoordinates({})).toBeNull()
        expect(parseBrasilApiCoordinates(null)).toBeNull()
    })

    it('devolve nulo com coordenada fora da faixa ou que não é número', () => {
        const outOfRange = { location: { coordinates: { latitude: '95', longitude: '-51' } } }
        const notNumber = { location: { coordinates: { latitude: 'abc', longitude: '-51' } } }

        expect(parseBrasilApiCoordinates(outOfRange)).toBeNull()
        expect(parseBrasilApiCoordinates(notNumber)).toBeNull()
    })
})

describe('parseNominatimCoordinates', () => {
    it('lê o primeiro resultado com a coordenada em texto', () => {
        const body = [{ lat: '-21.7258', lon: '-51.0187' }]

        expect(parseNominatimCoordinates(body)).toEqual({ latitude: -21.7258, longitude: -51.0187 })
    })

    it('devolve nulo com lista vazia, ausente ou fora do formato', () => {
        expect(parseNominatimCoordinates([])).toBeNull()
        expect(parseNominatimCoordinates([{}])).toBeNull()
        expect(parseNominatimCoordinates([{ lat: '', lon: '' }])).toBeNull()
        expect(parseNominatimCoordinates({ lat: '1', lon: '1' })).toBeNull()
        expect(parseNominatimCoordinates(null)).toBeNull()
    })

    it('devolve nulo com coordenada fora da faixa', () => {
        expect(parseNominatimCoordinates([{ lat: '10', lon: '-181' }])).toBeNull()
    })
})

describe('locateByStreet', () => {
    it('devolve nulo sem chamar o serviço quando falta a cidade', async () => {
        const fetchMock = stubFetch(async () => jsonResponse([]))

        const result = await locateByStreet({ street: 'Rua A', number: '1', city: '  ', state: 'SP' })

        expect(result).toBeNull()
        expect(fetchMock).not.toHaveBeenCalled()
    })
})

describe('locateAddress', () => {
    const address = { cep: '17780-043', street: 'Rua A', number: '48', city: 'Lucélia', state: 'SP' }

    it('usa a coordenada do CEP quando existe', async () => {
        const fetchMock = stubFetch(async () =>
            jsonResponse({ location: { coordinates: { latitude: '-21.72', longitude: '-51.01' } } }),
        )

        const result = await locateAddress(address)

        expect(result).toEqual({ latitude: -21.72, longitude: -51.01 })
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('cai para a rua quando o CEP não tem coordenada', async () => {
        stubFetch(async (url) => {
            if (url.includes('brasilapi')) {
                return jsonResponse({ location: { coordinates: {} } })
            }
            return jsonResponse([{ lat: '-21.73', lon: '-51.02' }])
        })

        const result = await locateAddress(address)

        expect(result).toEqual({ latitude: -21.73, longitude: -51.02 })
    })

    it('devolve nulo quando tudo falha', async () => {
        stubFetch(async () => {
            throw new Error('sem rede')
        })

        const result = await locateAddress(address)

        expect(result).toBeNull()
    })
})
