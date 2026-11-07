import { describe, expect, it } from 'vitest'

import {
    calculateUnitPriceCents,
    describeGroupRule,
    findUnsatisfiedGroup,
    getGroupInputKind,
    getOptionCeiling,
    setOptionQuantity,
    toDraftOptions,
} from '@/pages/store-menu/model/pricing'
import type { OptionGroup, Product } from '@/pages/store-menu/model/types'

const meatPoint: OptionGroup = {
    id: 'ponto',
    title: 'Qual o ponto da carne?',
    minChoices: 1,
    maxChoices: 1,
    options: [
        { id: 'mal', name: 'Mal passado', description: null, priceCents: 0, maxQuantity: 1 },
        { id: 'ao-ponto', name: 'Ao ponto', description: null, priceCents: 0, maxQuantity: 1 },
    ],
}

const boost: OptionGroup = {
    id: 'turbinar',
    title: 'Turbinar',
    minChoices: 0,
    maxChoices: null,
    options: [
        { id: 'bacon', name: 'Bacon', description: null, priceCents: 400, maxQuantity: 5 },
        { id: 'cheddar', name: 'Cheddar', description: null, priceCents: 300, maxQuantity: 5 },
    ],
}

const sauces: OptionGroup = {
    id: 'molhos',
    title: 'Molhos',
    minChoices: 1,
    maxChoices: 2,
    options: [
        { id: 'ketchup', name: 'Ketchup', description: null, priceCents: 0, maxQuantity: 1 },
        { id: 'mostarda', name: 'Mostarda', description: null, priceCents: 0, maxQuantity: 1 },
        { id: 'maionese', name: 'Maionese', description: null, priceCents: 0, maxQuantity: 1 },
    ],
}

const burger: Product = {
    id: 'x-bacon',
    categoryId: 'lanches',
    name: 'X-BACON',
    description: null,
    priceCents: 3399,
    promoPriceCents: null,
    serves: 1,
    portionLabel: null,
    imageUrl: null,
    featured: false,
    optionGroups: [meatPoint, boost, sauces],
}

describe('getGroupInputKind', () => {
    it('trata limite de 1 como escolha única, repetição como quantidade e o resto como múltipla', () => {
        expect(getGroupInputKind(meatPoint)).toBe('single')
        expect(getGroupInputKind(boost)).toBe('quantity')
        expect(getGroupInputKind(sauces)).toBe('multiple')
    })
})

describe('setOptionQuantity', () => {
    it('troca a opção anterior em grupo de escolha única', () => {
        const first = setOptionQuantity(meatPoint, meatPoint.options[0], 1, {})
        const second = setOptionQuantity(meatPoint, meatPoint.options[1], 1, first)

        expect(second).toEqual({ 'ao-ponto': 1 })
    })

    it('não deixa passar do limite do grupo', () => {
        const twoSauces = setOptionQuantity(sauces, sauces.options[1], 1, { ketchup: 1 })
        const third = setOptionQuantity(sauces, sauces.options[2], 1, twoSauces)

        expect(third).toEqual({ ketchup: 1, mostarda: 1 })
        expect(getOptionCeiling(sauces, sauces.options[2], twoSauces)).toBe(0)
    })

    it('deixa subir sem teto quando o opcional não tem limite', () => {
        const unlimited = { ...boost, options: [{ ...boost.options[0], maxQuantity: null }] }

        expect(getGroupInputKind(unlimited)).toBe('quantity')
        expect(setOptionQuantity(unlimited, unlimited.options[0], 12, {})).toEqual({ bacon: 12 })
    })

    it('respeita o máximo por opcional e remove ao zerar', () => {
        const capped = setOptionQuantity(boost, boost.options[0], 9, {})
        const removed = setOptionQuantity(boost, boost.options[0], 0, capped)

        expect(capped).toEqual({ bacon: 5 })
        expect(removed).toEqual({})
    })
})

describe('calculateUnitPriceCents', () => {
    it('soma preço base e opcionais vezes a quantidade', () => {
        const selection = { 'ao-ponto': 1, bacon: 2, cheddar: 1, ketchup: 1 }

        expect(calculateUnitPriceCents(burger, selection)).toBe(3399 + 800 + 300)
    })

    it('usa o preço promocional quando existe', () => {
        const onSale = { ...burger, promoPriceCents: 2999 }

        expect(calculateUnitPriceCents(onSale, {})).toBe(2999)
    })
})

describe('findUnsatisfiedGroup', () => {
    it('aponta o primeiro grupo obrigatório sem escolha', () => {
        expect(findUnsatisfiedGroup(burger, {})?.id).toBe('ponto')
        expect(findUnsatisfiedGroup(burger, { 'ao-ponto': 1 })?.id).toBe('molhos')
        expect(findUnsatisfiedGroup(burger, { 'ao-ponto': 1, ketchup: 1 })).toBeUndefined()
    })
})

describe('describeGroupRule', () => {
    it('descreve cada combinação de mínimo e máximo', () => {
        expect(describeGroupRule(meatPoint)).toBe('Escolha 1 opção')
        expect(describeGroupRule(boost)).toBe('Opcional')
        expect(describeGroupRule(sauces)).toBe('Escolha de 1 a 2 opções')
        expect(describeGroupRule({ ...sauces, minChoices: 0 })).toBe('Escolha até 2 opções')
    })
})

describe('toDraftOptions', () => {
    it('lista só o que foi escolhido, com preço e quantidade', () => {
        expect(toDraftOptions(burger, { bacon: 2, 'ao-ponto': 1 })).toEqual([
            { optionId: 'ao-ponto', name: 'Ao ponto', quantity: 1, priceCents: 0 },
            { optionId: 'bacon', name: 'Bacon', quantity: 2, priceCents: 400 },
        ])
    })
})
