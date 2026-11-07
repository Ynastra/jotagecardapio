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

const VIACEP_URL = 'https://viacep.com.br/ws'

// null quando o CEP não existe ou a consulta falhou: nos dois casos a pessoa
// preenche o endereço à mão.
export async function lookupCep(cep: string): Promise<CepAddress | null> {
    const digits = keepDigits(cep)

    try {
        const response = await fetch(`${VIACEP_URL}/${digits}/json/`)

        if (!response.ok) {
            return null
        }

        const body = (await response.json()) as ViaCepResponse

        if (body.erro) {
            return null
        }

        const address = {
            street: body.logradouro ?? '',
            neighborhood: body.bairro ?? '',
            city: body.localidade ?? '',
            state: body.uf ?? '',
        }
        return address
    } catch {
        // Sem rede ou resposta fora do formato: o formulário segue com os campos livres.
        return null
    }
}
