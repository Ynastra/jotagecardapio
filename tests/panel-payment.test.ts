import { describe, expect, it } from 'vitest'

import {
    formFromData,
    isPaymentFormDirty,
    validatePaymentForm,
    type MethodRule,
    type PaymentForm,
} from '@/pages/panel-payment/model/payment-form'
import { normalizePixKey, pixKeyForDisplay } from '@/pages/panel-payment/model/pix-key'

const BOTH_MODES = { acceptsDelivery: true, acceptsPickup: true }

const rules: MethodRule[] = [
    { method: 'pix', enabledDelivery: true, enabledPickup: true, feeKind: 'fixed', feePercent: 0, feeFixedCents: 0 },
    { method: 'cash', enabledDelivery: true, enabledPickup: true, feeKind: 'fixed', feePercent: 0, feeFixedCents: 0 },
]

const loaded = formFromData(rules, { pixKey: '11222333000181', pixKeyType: 'cnpj' })

function withMethod(method: string, patch: Partial<PaymentForm['methods'][number]>): PaymentForm {
    const form = {
        ...loaded,
        methods: loaded.methods.map((rule) => (rule.method === method ? { ...rule, ...patch } : rule)),
    }
    return form
}

describe('normalizePixKey', () => {
    it('aceita CNPJ válido com máscara e grava só dígitos', () => {
        expect(normalizePixKey('cnpj', '11.222.333/0001-81')).toEqual({ value: '11222333000181', error: null })
    })

    it('recusa CNPJ com dígito verificador errado, tamanho errado ou repetido', () => {
        expect(normalizePixKey('cnpj', '11.222.333/0001-82').error).toBe('Informe um CNPJ válido.')
        expect(normalizePixKey('cnpj', '1122233').error).toBe('Informe um CNPJ válido.')
        expect(normalizePixKey('cnpj', '11111111111111').error).toBe('Informe um CNPJ válido.')
    })

    it('aceita CPF válido e recusa o inválido', () => {
        expect(normalizePixKey('cpf', '529.982.247-25')).toEqual({ value: '52998224725', error: null })
        expect(normalizePixKey('cpf', '529.982.247-24').error).toBe('Informe um CPF válido.')
        expect(normalizePixKey('cpf', '000.000.000-00').error).toBe('Informe um CPF válido.')
    })

    it('aceita telefone com ou sem +55 e máscara e grava +55 mais DDD e número', () => {
        const expected = { value: '+5518996649346', error: null }

        expect(normalizePixKey('phone', '(18) 99664-9346')).toEqual(expected)
        expect(normalizePixKey('phone', '+55 (18) 99664-9346')).toEqual(expected)
        expect(normalizePixKey('phone', '5518996649346')).toEqual(expected)
        expect(normalizePixKey('phone', '+5518996649346')).toEqual(expected)
        expect(normalizePixKey('phone', '(18) 3333-4444').value).toBe('+551833334444')
    })

    it('recusa telefone sem DDD', () => {
        expect(normalizePixKey('phone', '99664-9346').error).toBe('Informe um telefone com DDD.')
    })

    it('mantém DDD 55 com número de 11 dígitos sem tratar como código do país', () => {
        expect(normalizePixKey('phone', '(55) 99664-9346').value).toBe('+5555996649346')
    })

    it('exibe a chave telefone normalizada na prévia e como digitada enquanto incompleta', () => {
        expect(pixKeyForDisplay('phone', '(18) 99664-9346')).toBe('+5518996649346')
        expect(pixKeyForDisplay('phone', '(18) 996')).toBe('(18) 996')
        expect(pixKeyForDisplay('', ' abc ')).toBe('abc')
    })

    it('aceita e-mail em minúsculas e recusa o malformado', () => {
        expect(normalizePixKey('email', ' Loja@Exemplo.com ')).toEqual({ value: 'loja@exemplo.com', error: null })
        expect(normalizePixKey('email', 'loja@exemplo').error).toBe('Informe um e-mail válido.')
    })

    it('aceita chave aleatória no formato UUID e recusa o resto', () => {
        const key = '123E4567-E89B-12D3-A456-426614174000'

        expect(normalizePixKey('random', key)).toEqual({ value: key.toLowerCase(), error: null })
        expect(normalizePixKey('random', 'abc123').error).toContain('formato')
    })
})

describe('validatePaymentForm', () => {
    it('aceita o formulário carregado e devolve regras e chave prontas para gravar', () => {
        const result = validatePaymentForm(loaded, BOTH_MODES)

        expect(result.errors.fees).toEqual({})
        expect(result.value?.pix).toEqual({ pixKey: '11222333000181', pixKeyType: 'cnpj' })
        expect(result.value?.rules).toHaveLength(6)
        expect(result.value?.rules.find((rule) => rule.method === 'debit')).toMatchObject({
            enabledDelivery: false,
            enabledPickup: false,
        })
    })

    it('aceita taxa em percentual de 0 a 100 e recusa fora disso', () => {
        const ok = validatePaymentForm(withMethod('credit', { feeKind: 'percent', feePercentText: '3,5' }), BOTH_MODES)
        const high = validatePaymentForm(withMethod('credit', { feeKind: 'percent', feePercentText: '100,5' }), BOTH_MODES)
        const text = validatePaymentForm(withMethod('credit', { feeKind: 'percent', feePercentText: 'abc' }), BOTH_MODES)

        expect(ok.value?.rules.find((rule) => rule.method === 'credit')).toMatchObject({
            feeKind: 'percent',
            feePercent: 3.5,
        })
        expect(high.errors.fees.credit).toBe('Informe uma taxa de 0 a 100%.')
        expect(text.errors.fees.credit).toBe('Informe uma taxa de 0 a 100%.')
    })

    it('aceita taxa fixa em reais, vazia como zero, e recusa texto sem número', () => {
        const fixed = validatePaymentForm(withMethod('cash', { feeKind: 'fixed', feeFixedText: '2,50' }), BOTH_MODES)
        const empty = validatePaymentForm(withMethod('cash', { feeKind: 'fixed', feeFixedText: '' }), BOTH_MODES)
        const text = validatePaymentForm(withMethod('cash', { feeKind: 'fixed', feeFixedText: 'abc' }), BOTH_MODES)

        expect(fixed.value?.rules.find((rule) => rule.method === 'cash')?.feeFixedCents).toBe(250)
        expect(empty.value?.rules.find((rule) => rule.method === 'cash')?.feeFixedCents).toBe(0)
        expect(text.errors.fees.cash).toBe('Informe um valor em reais.')
    })

    it('ignora o texto da taxa que não está em uso', () => {
        const unused = validatePaymentForm(
            withMethod('cash', { feeKind: 'fixed', feeFixedText: '1', feePercentText: 'abc' }),
            BOTH_MODES,
        )

        expect(unused.errors.fees).toEqual({})
    })

    it('exige chave quando o Pix está ligado em entrega ou retirada', () => {
        const noKey = { ...loaded, pixKey: '' }
        const pickupOnly = {
            ...withMethod('pix', { enabledDelivery: false }),
            pixKey: '',
        }

        expect(validatePaymentForm(noKey, BOTH_MODES).errors.pixKey).toBe('Pix ligado precisa de uma chave.')
        expect(validatePaymentForm(pickupOnly, BOTH_MODES).errors.pixKey).toBe('Pix ligado precisa de uma chave.')
        expect(validatePaymentForm(noKey, BOTH_MODES).value).toBeNull()
    })

    it('aceita Pix desligado sem chave e grava chave e tipo vazios', () => {
        const pixOff = {
            ...withMethod('pix', { enabledDelivery: false, enabledPickup: false }),
            pixKey: '',
            pixKeyType: '' as const,
        }

        const result = validatePaymentForm(pixOff, BOTH_MODES)

        expect(result.errors.pixKey).toBeUndefined()
        expect(result.value?.pix).toEqual({ pixKey: null, pixKeyType: null })
    })

    it('valida a chave pelo tipo escolhido e exige o tipo quando há chave', () => {
        const wrongKey = { ...loaded, pixKeyType: 'cpf' as const }
        const noType = { ...loaded, pixKeyType: '' as const }

        expect(validatePaymentForm(wrongKey, BOTH_MODES).errors.pixKey).toBe('Informe um CPF válido.')
        expect(validatePaymentForm(noType, BOTH_MODES).errors.pixKeyType).toBe('Escolha o tipo da chave.')
    })

    it('exige uma forma ligada para cada modo que a loja aceita', () => {
        const noDelivery = {
            ...loaded,
            methods: loaded.methods.map((rule) => ({ ...rule, enabledDelivery: false })),
        }

        const both = validatePaymentForm(noDelivery, BOTH_MODES)
        const pickupOnlyStore = validatePaymentForm(noDelivery, { acceptsDelivery: false, acceptsPickup: true })

        expect(both.errors.delivery).toBe('Ligue pelo menos uma forma de pagamento para entrega.')
        expect(both.errors.pickup).toBeUndefined()
        expect(both.value).toBeNull()
        expect(pickupOnlyStore.errors.delivery).toBeUndefined()
        expect(pickupOnlyStore.value).not.toBeNull()
    })
})

describe('isPaymentFormDirty', () => {
    it('só acusa diferença quando algo mudou em relação ao carregado', () => {
        expect(isPaymentFormDirty(loaded, formFromData(rules, { pixKey: '11222333000181', pixKeyType: 'cnpj' }))).toBe(
            false,
        )
        expect(isPaymentFormDirty(loaded, withMethod('cash', { enabledPickup: false }))).toBe(true)
        expect(isPaymentFormDirty(loaded, { ...loaded, pixKey: '1' })).toBe(true)
    })
})
