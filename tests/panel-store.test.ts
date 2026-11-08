import { describe, expect, it } from 'vitest'

import type { StoreSettings } from '@/entities/store'
import {
    describeBrandColor,
    formatRatio,
    formFromSettings,
    isStoreFormDirty,
    validateFulfillment,
    validateStoreForm,
    type StoreForm,
} from '@/pages/panel-store/model/store-form'

const settings: StoreSettings = {
    id: 'loja',
    slug: 'zedoburguerlucelia',
    name: 'Zé do Burguer',
    whatsapp: '5518996649346',
    minOrderCents: 700,
    address: 'Rua A, 10',
    city: 'Lucélia',
    state: 'SP',
    addressDisplay: 'full',
    acceptsDelivery: true,
    acceptsPickup: true,
    requireCep: false,
    orderCopyWhatsapp: true,
    hideUnavailableItems: true,
    cartNoticeTitle: null,
    cartNoticeBody: null,
    brandColor: '#060504',
    logoUrl: null,
    coverUrl: null,
    prepTimeMinutes: 40,
    deliveryMode: 'fixed',
    deliveryFeeCents: 500,
    deliveryMaxKm: null,
    freeDeliveryAboveCents: null,
    pixKey: null,
    pixKeyType: null,
    latitude: null,
    longitude: null,
}

const loaded = formFromSettings(settings)

function withChange(patch: Partial<StoreForm>): StoreForm {
    const form = { ...loaded, ...patch }
    return form
}

describe('formFromSettings', () => {
    it('mostra o WhatsApp sem o 55 e o pedido mínimo em reais, vazio quando é zero', () => {
        expect(loaded.whatsapp).toBe('(18) 99664-9346')
        expect(loaded.minOrderText).toBe('7,00')
        expect(formFromSettings({ ...settings, minOrderCents: 0 }).minOrderText).toBe('')
    })

    it('troca campos vazios do banco por texto vazio', () => {
        const blank = formFromSettings({ ...settings, address: null, city: null, state: null, brandColor: null })

        expect(blank).toMatchObject({ address: '', city: '', state: '', brandColor: '' })
    })
})

describe('validateStoreForm', () => {
    it('aceita o formulário carregado e devolve os valores prontos para gravar', () => {
        const result = validateStoreForm(loaded)

        expect(result.errors).toEqual({})
        expect(result.value).toMatchObject({
            name: 'Zé do Burguer',
            whatsapp: '5518996649346',
            minOrderCents: 700,
            state: 'SP',
            brandColor: '#060504',
        })
    })

    it('exige nome, com até 80 caracteres', () => {
        expect(validateStoreForm(withChange({ name: '  ' })).errors.name).toBe('Informe o nome da loja.')
        expect(validateStoreForm(withChange({ name: 'a'.repeat(81) })).errors.name).toBe('Use até 80 caracteres.')
        expect(validateStoreForm(withChange({ name: 'a'.repeat(80) })).errors.name).toBeUndefined()
    })

    it('exige WhatsApp com DDD e grava só dígitos com o 55', () => {
        expect(validateStoreForm(withChange({ whatsapp: '99664' })).errors.whatsapp).toBe('Informe o WhatsApp com DDD.')
        expect(validateStoreForm(withChange({ whatsapp: '(18) 3333-4444' })).value?.whatsapp).toBe('551833334444')
    })

    it('trata pedido mínimo vazio como zero e recusa texto sem número', () => {
        expect(validateStoreForm(withChange({ minOrderText: '' })).value?.minOrderCents).toBe(0)
        expect(validateStoreForm(withChange({ minOrderText: '12,50' })).value?.minOrderCents).toBe(1250)
        expect(validateStoreForm(withChange({ minOrderText: 'abc' })).errors.minOrderText).toBe('Informe um valor válido.')
    })

    it('aceita UF vazia ou da lista e recusa as demais', () => {
        expect(validateStoreForm(withChange({ state: '' })).value?.state).toBeNull()
        expect(validateStoreForm(withChange({ state: 'XX' })).errors.state).toBe('Escolha uma UF da lista.')
    })

    it('limita endereço e cidade', () => {
        expect(validateStoreForm(withChange({ address: 'a'.repeat(201) })).errors.address).toBe('Use até 200 caracteres.')
        expect(validateStoreForm(withChange({ city: 'a'.repeat(81) })).errors.city).toBe('Use até 80 caracteres.')
    })

    it('exige pelo menos uma forma de atendimento', () => {
        const none = validateStoreForm(withChange({ acceptsDelivery: false, acceptsPickup: false }))

        expect(none.errors.fulfillment).toBe('Deixe pelo menos uma forma de atendimento ligada.')
        expect(none.value).toBeNull()
        expect(validateFulfillment({ acceptsDelivery: false, acceptsPickup: true })).toBeUndefined()
    })

    it('recusa ligar um modo de atendimento sem forma de pagamento ligada para ele', () => {
        const onlyDeliveryPaid = { delivery: true, pickup: false }
        const bothOn = { acceptsDelivery: true, acceptsPickup: true }

        expect(validateFulfillment(bothOn, onlyDeliveryPaid)).toContain('retirada')
        expect(validateFulfillment({ acceptsDelivery: true, acceptsPickup: false }, onlyDeliveryPaid)).toBeUndefined()
        expect(validateFulfillment(bothOn, { delivery: false, pickup: true })).toContain('entrega')
        expect(validateStoreForm(withChange(bothOn), onlyDeliveryPaid).value).toBeNull()
        expect(validateStoreForm(withChange(bothOn), { delivery: true, pickup: true }).errors.fulfillment).toBeUndefined()
    })

    it('limita título e texto do recado e desliga o recado quando os dois ficam vazios', () => {
        const long = validateStoreForm(withChange({ cartNoticeTitle: 'a'.repeat(61), cartNoticeBody: 'a'.repeat(301) }))
        const empty = validateStoreForm(withChange({ cartNoticeTitle: ' ', cartNoticeBody: '' }))

        expect(long.errors.cartNoticeTitle).toBe('Use até 60 caracteres.')
        expect(long.errors.cartNoticeBody).toBe('Use até 300 caracteres.')
        expect(empty.value).toMatchObject({ cartNoticeTitle: null, cartNoticeBody: null })
    })

    it('aceita cor vazia como a padrão do tema e recusa hexadecimal malformado', () => {
        expect(validateStoreForm(withChange({ brandColor: '' })).value?.brandColor).toBeNull()
        expect(validateStoreForm(withChange({ brandColor: '#12' })).errors.brandColor).toBe('Use o formato #RRGGBB.')
        expect(validateStoreForm(withChange({ brandColor: '#0178DA' })).errors.brandColor).toBeUndefined()
    })
})

describe('isStoreFormDirty', () => {
    it('só acusa diferença quando algum campo mudou em relação ao carregado', () => {
        expect(isStoreFormDirty(loaded, { ...loaded })).toBe(false)
        expect(isStoreFormDirty(loaded, withChange({ name: 'Outro nome' }))).toBe(true)
        expect(isStoreFormDirty(loaded, withChange({ logoUrl: 'https://exemplo.test/logo.webp' }))).toBe(true)
        expect(isStoreFormDirty(loaded, withChange({ acceptsPickup: false }))).toBe(true)
    })

    it('volta a limpo quando o campo retorna ao valor original', () => {
        const edited = withChange({ name: 'Outro nome' })

        expect(isStoreFormDirty(loaded, { ...edited, name: loaded.name })).toBe(false)
    })
})

describe('describeBrandColor', () => {
    it('não descreve cor vazia ou inválida', () => {
        expect(describeBrandColor('')).toBeNull()
        expect(describeBrandColor('#12')).toBeNull()
    })

    it('marca boa legibilidade do texto e cor visível contra o fundo', () => {
        const report = describeBrandColor('#041f4a')

        expect(report?.isTextReadable).toBe(true)
        expect(report?.isVisibleOnPage).toBe(true)
    })

    it('avisa quando a cor se confunde com o fundo da página', () => {
        const report = describeBrandColor('#f0e68c')

        expect(report?.isVisibleOnPage).toBe(false)
    })
})

describe('formatRatio', () => {
    it('usa vírgula decimal', () => {
        expect(formatRatio(20.4)).toBe('20,4:1')
    })
})
