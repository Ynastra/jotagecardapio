import { describe, expect, it } from 'vitest'

import type { StoreSettings } from '@/entities/store'
import {
    formFromSettings,
    isDeliveryFormDirty,
    listLocationQueries,
    validateDeliveryForm,
    type DeliveryForm,
} from '@/pages/panel-delivery/model/delivery-form'
import { countActiveZones, isLastActiveZone, validateZoneDraft, type DeliveryZone } from '@/pages/panel-delivery/model/zones'

const settings: StoreSettings = {
    id: 'loja',
    slug: 'zedoburguerlucelia',
    name: 'Zé do Burguer',
    whatsapp: '5518996649346',
    minOrderCents: 700,
    address: null,
    city: null,
    state: null,
    addressDisplay: 'full',
    acceptsDelivery: true,
    acceptsPickup: true,
    requireCep: false,
    orderCopyWhatsapp: true,
    hideUnavailableItems: true,
    cartNoticeTitle: null,
    cartNoticeBody: null,
    brandColor: null,
    logoUrl: null,
    coverUrl: null,
    prepTimeMinutes: 40,
    deliveryMode: 'radius',
    deliveryFeeCents: 800,
    deliveryMaxKm: 6,
    freeDeliveryAboveCents: null,
    pixKey: null,
    pixKeyType: null,
    latitude: -21.72028,
    longitude: -51.01889,
}

const loaded = formFromSettings(settings)

function withChange(patch: Partial<DeliveryForm>): DeliveryForm {
    const form = { ...loaded, ...patch }
    return form
}

describe('listLocationQueries', () => {
    it('tenta o endereço completo e depois só o logradouro com cidade e UF', () => {
        const form = formFromSettings({
            ...settings,
            address: 'Rua Francisco Xavier de Oliveira, 48, Lado Este',
            city: 'Lucélia',
            state: 'SP',
        })

        expect(listLocationQueries(form)).toEqual([
            'Rua Francisco Xavier de Oliveira, 48, Lado Este, Lucélia, SP',
            'Rua Francisco Xavier de Oliveira, Lucélia, SP',
        ])
    })

    it('não repete a consulta quando o endereço não tem vírgula', () => {
        const form = formFromSettings({ ...settings, address: 'Praça Central', city: 'Lucélia', state: 'SP' })

        expect(listLocationQueries(form)).toEqual(['Praça Central, Lucélia, SP'])
    })

    it('fica vazia sem endereço, cidade e UF', () => {
        expect(listLocationQueries(loaded)).toEqual([])
    })
})

describe('formFromSettings', () => {
    it('mostra taxa em reais, raio com vírgula e frete grátis desligado quando vazio', () => {
        expect(loaded).toMatchObject({
            prepTimeText: '40',
            mode: 'radius',
            feeText: '8,00',
            maxKmText: '6',
            hasFreeDelivery: false,
            freeAboveText: '',
        })
    })

    it('liga o frete grátis quando há valor', () => {
        const withFree = formFromSettings({ ...settings, freeDeliveryAboveCents: 5000, deliveryMaxKm: 2.5 })

        expect(withFree).toMatchObject({ hasFreeDelivery: true, freeAboveText: '50,00', maxKmText: '2,5' })
    })
})

describe('validateDeliveryForm', () => {
    it('aceita o formulário carregado e devolve os valores no modo Raio de km', () => {
        const result = validateDeliveryForm(loaded, 0)

        expect(result.errors).toEqual({})
        expect(result.value).toEqual({
            prepTimeMinutes: 40,
            deliveryMode: 'radius',
            freeDeliveryAboveCents: null,
            deliveryFeeCents: 800,
            deliveryMaxKm: 6,
            latitude: -21.72028,
            longitude: -51.01889,
        })
    })

    it('aceita a loja sem localização e grava as duas coordenadas vazias', () => {
        const result = validateDeliveryForm(withChange({ latitudeText: '', longitudeText: '' }), 0)

        expect(result.errors).toEqual({})
        expect(result.value).toMatchObject({ latitude: null, longitude: null })
    })

    it('exige latitude e longitude juntas', () => {
        expect(validateDeliveryForm(withChange({ longitudeText: '' }), 0).errors.longitudeText).toBeDefined()
        expect(validateDeliveryForm(withChange({ latitudeText: '' }), 0).errors.latitudeText).toBeDefined()
    })

    it('recusa coordenada fora da faixa ou que não é número', () => {
        expect(validateDeliveryForm(withChange({ latitudeText: '91' }), 0).errors.latitudeText).toBeDefined()
        expect(validateDeliveryForm(withChange({ longitudeText: '-181' }), 0).errors.longitudeText).toBeDefined()
        expect(validateDeliveryForm(withChange({ latitudeText: 'abc' }), 0).errors.latitudeText).toBeDefined()
    })

    it('aceita coordenada com vírgula decimal', () => {
        const result = validateDeliveryForm(withChange({ latitudeText: '-21,72028', longitudeText: '-51,01889' }), 0)

        expect(result.value).toMatchObject({ latitude: -21.72028, longitude: -51.01889 })
    })

    it.each(['', '0', '241', '12,5', 'abc'])('recusa preparo "%s"', (prepTimeText) => {
        expect(validateDeliveryForm(withChange({ prepTimeText }), 0).errors.prepTimeText).toBeDefined()
    })

    it.each(['1', '240'])('aceita preparo nos limites (%s)', (prepTimeText) => {
        expect(validateDeliveryForm(withChange({ prepTimeText }), 0).errors.prepTimeText).toBeUndefined()
    })

    it('exige a taxa nos modos fixo e raio, aceitando zero', () => {
        expect(validateDeliveryForm(withChange({ feeText: '' }), 0).errors.feeText).toBe('Informe a taxa de entrega.')
        expect(validateDeliveryForm(withChange({ mode: 'fixed', feeText: '' }), 0).errors.feeText).toBeDefined()
        expect(validateDeliveryForm(withChange({ feeText: '0' }), 0).value?.deliveryFeeCents).toBe(0)
    })

    it('exige o raio só no modo Raio de km, de mais de 0 até 50', () => {
        expect(validateDeliveryForm(withChange({ maxKmText: '' }), 0).errors.maxKmText).toBeDefined()
        expect(validateDeliveryForm(withChange({ maxKmText: '0' }), 0).errors.maxKmText).toBeDefined()
        expect(validateDeliveryForm(withChange({ maxKmText: '50,1' }), 0).errors.maxKmText).toBeDefined()
        expect(validateDeliveryForm(withChange({ maxKmText: '50' }), 0).errors.maxKmText).toBeUndefined()
        expect(validateDeliveryForm(withChange({ mode: 'fixed', maxKmText: '' }), 0).errors.maxKmText).toBeUndefined()
    })

    it('em Taxa fixa grava a taxa e não manda o raio', () => {
        const value = validateDeliveryForm(withChange({ mode: 'fixed', feeText: '5,50' }), 0).value

        expect(value).toMatchObject({ deliveryMode: 'fixed', deliveryFeeCents: 550 })
        expect(value).not.toHaveProperty('deliveryMaxKm')
    })

    it('exige bairro ativo em Por bairro e não cobra a taxa da loja', () => {
        const byNeighborhood = withChange({ mode: 'neighborhood', feeText: '' })

        expect(validateDeliveryForm(byNeighborhood, 0).errors.mode).toBe(
            'Ative pelo menos um bairro para entregar por bairro.',
        )
        expect(validateDeliveryForm(byNeighborhood, 0).errors.feeText).toBeUndefined()

        const saved = validateDeliveryForm(byNeighborhood, 2).value
        expect(saved).toMatchObject({ deliveryMode: 'neighborhood' })
        expect(saved).not.toHaveProperty('deliveryFeeCents')
    })

    it('não cobra bairro ativo fora do modo Por bairro', () => {
        expect(validateDeliveryForm(withChange({ mode: 'fixed' }), 0).errors.mode).toBeUndefined()
    })

    it('com frete grátis ligado exige o valor, e desligado grava vazio', () => {
        expect(validateDeliveryForm(withChange({ hasFreeDelivery: true }), 0).errors.freeAboveText).toBeDefined()
        expect(
            validateDeliveryForm(withChange({ hasFreeDelivery: true, freeAboveText: '60' }), 0).value
                ?.freeDeliveryAboveCents,
        ).toBe(6000)
        expect(
            validateDeliveryForm(withChange({ hasFreeDelivery: false, freeAboveText: '60' }), 0).value
                ?.freeDeliveryAboveCents,
        ).toBeNull()
    })
})

describe('isDeliveryFormDirty', () => {
    it('acusa diferença só quando algum campo mudou', () => {
        expect(isDeliveryFormDirty(loaded, { ...loaded })).toBe(false)
        expect(isDeliveryFormDirty(loaded, withChange({ mode: 'fixed' }))).toBe(true)
        expect(isDeliveryFormDirty(loaded, withChange({ hasFreeDelivery: true }))).toBe(true)
    })
})

describe('validateZoneDraft', () => {
    const zones: DeliveryZone[] = [
        { id: 'a', neighborhood: 'Centro', feeCents: 300, active: true },
        { id: 'b', neighborhood: 'Vila Nova', feeCents: 500, active: false },
    ]

    it('aceita bairro novo e devolve nome aparado e taxa em centavos', () => {
        const result = validateZoneDraft({ neighborhood: '  Jardim  ', feeText: '4,50' }, zones)

        expect(result.errors).toEqual({})
        expect(result.value).toEqual({ neighborhood: 'Jardim', feeCents: 450 })
    })

    it('exige nome e taxa', () => {
        const result = validateZoneDraft({ neighborhood: ' ', feeText: '' }, zones)

        expect(result.errors).toEqual({ neighborhood: 'Informe o nome do bairro.', feeText: 'Informe a taxa do bairro.' })
        expect(result.value).toBeNull()
    })

    it('limita o nome a 80 caracteres', () => {
        expect(validateZoneDraft({ neighborhood: 'a'.repeat(81), feeText: '1' }, zones).errors.neighborhood).toBe(
            'Use até 80 caracteres.',
        )
    })

    it('recusa nome duplicado ignorando caixa e espaços, e aceita a taxa zero', () => {
        expect(validateZoneDraft({ neighborhood: ' centro ', feeText: '3' }, zones).errors.neighborhood).toBe(
            'Já existe um bairro com esse nome.',
        )
        expect(validateZoneDraft({ neighborhood: 'Jardim', feeText: '0' }, zones).value?.feeCents).toBe(0)
    })

    it('ao editar, o próprio bairro fica fora da comparação', () => {
        const others = zones.filter((zone) => zone.id !== 'a')

        expect(validateZoneDraft({ neighborhood: 'Centro', feeText: '3' }, others).errors).toEqual({})
    })
})

describe('countActiveZones', () => {
    it('conta só os bairros ativados', () => {
        expect(
            countActiveZones([
                { id: 'a', neighborhood: 'Centro', feeCents: 300, active: true },
                { id: 'b', neighborhood: 'Vila Nova', feeCents: 500, active: false },
            ]),
        ).toBe(1)
    })
})

describe('isLastActiveZone', () => {
    const centro = { id: 'a', neighborhood: 'Centro', feeCents: 300, active: true }
    const vila = { id: 'b', neighborhood: 'Vila Nova', feeCents: 500, active: true }
    const inactive = { id: 'c', neighborhood: 'Jardim', feeCents: 400, active: false }

    it('reconhece o único bairro ativo', () => {
        expect(isLastActiveZone([centro, inactive], 'a')).toBe(true)
    })

    it('não protege quando há outro bairro ativo', () => {
        expect(isLastActiveZone([centro, vila], 'a')).toBe(false)
    })

    it('não protege um bairro já inativo', () => {
        expect(isLastActiveZone([centro, inactive], 'c')).toBe(false)
    })
})
