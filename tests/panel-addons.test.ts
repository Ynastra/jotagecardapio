import { describe, expect, it } from 'vitest'

import {
    formatPriceText,
    parsePriceText,
    validateGroupDraft,
    validateOptionDraft,
    type OptionDraft,
} from '@/pages/panel-addons/model/addon-form'
import {
    describeUsage,
    filterGroupsBySearch,
    type AddonGroup,
    type AddonOption,
} from '@/pages/panel-addons/model/addon-group'
import { nextPosition, planMove } from '@/pages/panel-addons/model/ordering'

function buildOption(overrides: Partial<AddonOption> = {}): AddonOption {
    return {
        id: 'option-1',
        groupId: 'group-1',
        name: 'Cheddar',
        description: null,
        imageUrl: null,
        priceCents: 300,
        maxQuantity: 1,
        position: 0,
        active: true,
        ...overrides,
    }
}

function buildGroup(overrides: Partial<AddonGroup> = {}): AddonGroup {
    return {
        id: 'group-1',
        title: 'Molhos',
        description: null,
        active: true,
        position: 0,
        options: [],
        productCount: 0,
        ...overrides,
    }
}

const validOptionDraft: OptionDraft = {
    groupId: 'group-1',
    name: 'Cheddar',
    description: '',
    priceText: '3,50',
    maxQuantityText: '',
    imageUrl: null,
}

describe('planMove', () => {
    const items = [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 },
    ]

    it('troca o item com o vizinho de cima', () => {
        expect(planMove(items, 'b', 'up')).toEqual([
            { id: 'b', position: 0 },
            { id: 'a', position: 1 },
        ])
    })

    it('troca o item com o vizinho de baixo', () => {
        expect(planMove(items, 'b', 'down')).toEqual([
            { id: 'c', position: 1 },
            { id: 'b', position: 2 },
        ])
    })

    it('não muda nada nas pontas nem com id desconhecido', () => {
        expect(planMove(items, 'a', 'up')).toEqual([])
        expect(planMove(items, 'c', 'down')).toEqual([])
        expect(planMove(items, 'x', 'up')).toEqual([])
    })

    it('acerta posições repetidas no primeiro movimento', () => {
        const repeated = [
            { id: 'a', position: 0 },
            { id: 'b', position: 0 },
        ]
        expect(planMove(repeated, 'b', 'up')).toEqual([{ id: 'a', position: 1 }])
    })
})

describe('nextPosition', () => {
    it('começa em zero numa lista vazia e segue a maior posição', () => {
        expect(nextPosition([])).toBe(0)
        expect(nextPosition([{ position: 0 }, { position: 4 }])).toBe(5)
    })
})

describe('validateGroupDraft', () => {
    it('exige o título e limita o tamanho', () => {
        expect(validateGroupDraft({ title: '  ', description: '' }).errors.title).toBeDefined()
        expect(validateGroupDraft({ title: 'a'.repeat(121), description: '' }).errors.title).toBeDefined()
        expect(validateGroupDraft({ title: 'a'.repeat(120), description: '' }).errors.title).toBeUndefined()
    })

    it('limita a descrição a 200 e guarda vazio como nulo', () => {
        expect(validateGroupDraft({ title: 'Molhos', description: 'a'.repeat(201) }).errors.description).toBeDefined()
        expect(validateGroupDraft({ title: ' Molhos ', description: ' ' }).value).toEqual({
            title: 'Molhos',
            description: null,
        })
    })
})

describe('validateOptionDraft', () => {
    it('converte preço e deixa o máximo vazio sem limite', () => {
        const { value } = validateOptionDraft(validOptionDraft)
        expect(value).toMatchObject({ priceCents: 350, maxQuantity: null })
    })

    it('trata preço vazio como zero e recusa preço inválido', () => {
        expect(validateOptionDraft({ ...validOptionDraft, priceText: '' }).value?.priceCents).toBe(0)
        expect(validateOptionDraft({ ...validOptionDraft, priceText: 'abc' }).errors.priceText).toBeDefined()
    })

    it('recusa máximo que não é inteiro a partir de 1', () => {
        expect(validateOptionDraft({ ...validOptionDraft, maxQuantityText: '0' }).errors.maxQuantityText).toBeDefined()
        expect(validateOptionDraft({ ...validOptionDraft, maxQuantityText: '1,5' }).errors.maxQuantityText).toBeDefined()
        expect(validateOptionDraft({ ...validOptionDraft, maxQuantityText: '3' }).value?.maxQuantity).toBe(3)
    })

    it('exige grupo e nome, e limita nome e descrição', () => {
        const result = validateOptionDraft({
            ...validOptionDraft,
            groupId: '',
            name: '',
            description: 'a'.repeat(201),
        })
        expect(result.value).toBeNull()
        expect(result.errors.groupId).toBeDefined()
        expect(result.errors.name).toBeDefined()
        expect(result.errors.description).toBeDefined()
        expect(validateOptionDraft({ ...validOptionDraft, name: 'a'.repeat(121) }).errors.name).toBeDefined()
    })
})

describe('texto de preço', () => {
    it('vai e volta sem perder centavos', () => {
        expect(formatPriceText(1050)).toBe('10,50')
        expect(parsePriceText(formatPriceText(1050))).toBe(1050)
    })
})

describe('filterGroupsBySearch', () => {
    const groups = [
        buildGroup({ id: 'g1', title: 'Molhos', options: [buildOption({ name: 'Cheddar' })] }),
        buildGroup({ id: 'g2', title: 'Bebidas', options: [buildOption({ id: 'o2', name: 'Guaraná' })] }),
    ]

    it('devolve tudo com busca vazia', () => {
        expect(filterGroupsBySearch(groups, '  ')).toHaveLength(2)
    })

    it('ignora acento e caixa, e o título casado mostra todos os itens', () => {
        const [match] = filterGroupsBySearch(groups, 'MOLHOS')
        expect(match.options).toHaveLength(1)
        expect(filterGroupsBySearch(groups, 'guarana').map((group) => group.id)).toEqual(['g2'])
    })
})

describe('describeUsage', () => {
    it('só descreve quando há produto usando', () => {
        expect(describeUsage(0)).toBeNull()
        expect(describeUsage(1)).toBe('Usado em 1 produto')
        expect(describeUsage(3)).toBe('Usado em 3 produtos')
    })
})
