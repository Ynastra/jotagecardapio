import { keepDigits } from '@/shared/lib'

export type CepAddress = {
    street: string
    neighborhood: string
    city: string
    state: string
}

type ViaCepResponse = {
    erro?: boolean | string
    logradouro?: string
    bairro?: string
    localidade?: string
    uf?: string
}

type BrasilApiResponse = {
    street?: string | null
    neighborhood?: string | null
    city?: string | null
    state?: string | null
}

const VIACEP_URL = 'https://viacep.com.br/ws'
const BRASIL_API_URL = 'https://brasilapi.com.br/api/cep/v2'
const REQUEST_TIMEOUT_MS = 8000

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
        // Sem rede, tempo esgotado ou corpo inválido: quem chamou tenta a próxima fonte.
        return null
    } finally {
        clearTimeout(timer)
    }
}

async function lookupViaCep(digits: string): Promise<CepAddress | null> {
    const body = (await fetchJson(`${VIACEP_URL}/${digits}/json/`)) as ViaCepResponse | null

    if (!body || body.erro) {
        return null
    }

    const address = {
        street: body.logradouro ?? '',
        neighborhood: body.bairro ?? '',
        city: body.localidade ?? '',
        state: body.uf ?? '',
    }
    return address
}

async function lookupBrasilApi(digits: string): Promise<CepAddress | null> {
    const body = (await fetchJson(`${BRASIL_API_URL}/${digits}`)) as BrasilApiResponse | null

    if (!body) {
        return null
    }

    const address = {
        street: body.street ?? '',
        neighborhood: body.neighborhood ?? '',
        city: body.city ?? '',
        state: body.state ?? '',
    }
    return address
}

// null só quando as duas fontes falham: a pessoa preenche o endereço à mão.
export async function lookupCep(cep: string): Promise<CepAddress | null> {
    const digits = keepDigits(cep)

    const fromViaCep = await lookupViaCep(digits)
    if (fromViaCep) {
        return fromViaCep
    }

    const fromBrasilApi = await lookupBrasilApi(digits)
    return fromBrasilApi
}
