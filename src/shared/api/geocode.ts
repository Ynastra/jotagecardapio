import { keepDigits } from '@/shared/lib'

export type Coordinates = {
    latitude: number
    longitude: number
}

export type StreetQuery = {
    street: string
    number: string
    city: string
    state: string
}

export type AddressQuery = StreetQuery & {
    cep: string
}

const BRASIL_API_URL = 'https://brasilapi.com.br/api/cep/v2'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const REQUEST_TIMEOUT_MS = 8000
const CEP_DIGITS = 8
const MAX_LATITUDE = 90
const MAX_LONGITUDE = 180

function toCoordinate(value: unknown, limit: number): number | null {
    const isNumeric = typeof value === 'number' || typeof value === 'string'
    if (!isNumeric) {
        return null
    }

    const text = String(value).trim()
    if (text === '') {
        return null
    }

    const parsed = Number(text)
    const isInRange = Number.isFinite(parsed) && Math.abs(parsed) <= limit
    const coordinate = isInRange ? parsed : null
    return coordinate
}

function toCoordinates(latitude: unknown, longitude: unknown): Coordinates | null {
    const parsedLatitude = toCoordinate(latitude, MAX_LATITUDE)
    const parsedLongitude = toCoordinate(longitude, MAX_LONGITUDE)

    if (parsedLatitude === null || parsedLongitude === null) {
        return null
    }

    const coordinates = { latitude: parsedLatitude, longitude: parsedLongitude }
    return coordinates
}

function asRecord(value: unknown): Record<string, unknown> | null {
    const isRecord = typeof value === 'object' && value !== null && !Array.isArray(value)
    const record = isRecord ? (value as Record<string, unknown>) : null
    return record
}

export function parseBrasilApiCoordinates(body: unknown): Coordinates | null {
    const root = asRecord(body)
    const location = asRecord(root?.location)
    const coordinates = asRecord(location?.coordinates)

    if (!coordinates) {
        return null
    }

    const parsed = toCoordinates(coordinates.latitude, coordinates.longitude)
    return parsed
}

export function parseNominatimCoordinates(body: unknown): Coordinates | null {
    if (!Array.isArray(body)) {
        return null
    }

    const first = asRecord(body[0])
    if (!first) {
        return null
    }

    const parsed = toCoordinates(first.lat, first.lon)
    return parsed
}

// null em qualquer falha (rede, tempo esgotado, resposta fora do formato).
async function fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
        const response = await fetch(url, { signal: controller.signal })

        if (!response.ok) {
            return null
        }

        const body: unknown = await response.json()
        return body
    } catch {
        // Sem rede, tempo esgotado ou corpo inválido: o endereço segue sem coordenada.
        return null
    } finally {
        clearTimeout(timer)
    }
}

async function searchNominatim(params: Record<string, string>): Promise<Coordinates | null> {
    const query = new URLSearchParams({ format: 'jsonv2', limit: '1', ...params })
    const body = await fetchJson(`${NOMINATIM_URL}?${query.toString()}`)
    const coordinates = parseNominatimCoordinates(body)
    return coordinates
}

export async function locateByCep(cep: string): Promise<Coordinates | null> {
    const digits = keepDigits(cep)
    const body = await fetchJson(`${BRASIL_API_URL}/${digits}`)
    const coordinates = parseBrasilApiCoordinates(body)
    return coordinates
}

export async function locateByStreet(query: StreetQuery): Promise<Coordinates | null> {
    const street = query.street.trim()
    const number = query.number.trim()
    const city = query.city.trim()
    const state = query.state.trim()

    if (city === '') {
        return null
    }

    const streetLine = `${number} ${street}`.trim()
    const coordinates = await searchNominatim({
        street: streetLine,
        city,
        state,
        country: 'Brasil',
    })
    return coordinates
}

export async function locateByText(text: string): Promise<Coordinates | null> {
    const trimmed = text.trim()

    if (trimmed === '') {
        return null
    }

    const coordinates = await searchNominatim({ q: trimmed, countrycodes: 'br' })
    return coordinates
}

export async function locateAddress(query: AddressQuery): Promise<Coordinates | null> {
    const digits = keepDigits(query.cep)

    if (digits.length === CEP_DIGITS) {
        const fromCep = await locateByCep(digits)
        if (fromCep) {
            return fromCep
        }
    }

    const fromStreet = await locateByStreet(query)
    return fromStreet
}
