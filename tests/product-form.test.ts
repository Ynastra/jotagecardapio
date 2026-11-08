import { describe, expect, it } from 'vitest'

import {
    buildPreviewProduct,
    createEmptyDraft,
    DESCRIPTION_MAX,
    draftFromProduct,
    isDraftDirty,
    isLinkRequired,
    moveItem,
    NAME_MAX,
    SERVES_MAX,
    setLinkRequired,
    validateProductDraft,
    type ProductDraft,
} from '@/pages/panel-product-edit/model/product-form'
import type { ManagedProduct } from '@/entities/product'

function buildDraft(overrides: Partial<ProductDraft> = {}): ProductDraft {
    return {
        ...createEmptyDraft('category-1'),
        name: 'X-Burger',
        priceText: '25,00',
        ...overrides,
    }
}

function validate(overrides: Partial<ProductDraft> = {}) {
    return validateProductDraft(buildDraft(overrides))
}

describe('validação do formulário de produto', () => {
    it('aceita o mínimo: categoria, título e preço', () => {
        const { errors, value } = validate()

        expect(errors.fields).toEqual({})
        expect(value?.values).toMatchObject({
            categoryId: 'category-1',
            name: 'X-Burger',
            priceCents: 2500,
            promoPriceCents: null,
            serves: null,
            portionAmount: null,
            portionUnit: null,
            stock: null,
            description: null,
        })
        expect(value?.links).toEqual([])
    })

    it('exige categoria', () => {
        expect(validate({ categoryId: '' }).errors.fields.categoryId).toBeDefined()
    })

    describe('título', () => {
        it('é obrigatório', () => {
            expect(validate({ name: '   ' }).errors.fields.name).toBeDefined()
        })

        it('aceita até o limite e recusa acima', () => {
            expect(validate({ name: 'a'.repeat(NAME_MAX) }).errors.fields.name).toBeUndefined()
            expect(validate({ name: 'a'.repeat(NAME_MAX + 1) }).errors.fields.name).toBeDefined()
        })

        it('grava o título sem espaços nas pontas', () => {
            expect(validate({ name: '  Suco  ' }).value?.values.name).toBe('Suco')
        })
    })

    describe('preço', () => {
        it('é obrigatório e precisa ser um número', () => {
            expect(validate({ priceText: '' }).errors.fields.priceText).toBeDefined()
            expect(validate({ priceText: 'abc' }).errors.fields.priceText).toBeDefined()
        })

        it('converte reais para centavos', () => {
            expect(validate({ priceText: '19,90' }).value?.values.priceCents).toBe(1990)
        })
    })

    describe('desconto', () => {
        it('vazio é sem desconto', () => {
            expect(validate({ promoText: '' }).value?.values.promoPriceCents).toBeNull()
        })

        it('precisa ficar abaixo do preço', () => {
            expect(validate({ promoText: '25,00' }).errors.fields.promoText).toBeDefined()
            expect(validate({ promoText: '30,00' }).errors.fields.promoText).toBeDefined()
            expect(validate({ promoText: '20,00' }).value?.values.promoPriceCents).toBe(2000)
        })

        it('recusa texto que não é número', () => {
            expect(validate({ promoText: 'x' }).errors.fields.promoText).toBeDefined()
        })
    })

    describe('medida', () => {
        it('aceita número com unidade', () => {
            const { value } = validate({ portionText: '1,5', portionUnit: 'kg' })

            expect(value?.values.portionAmount).toBe(1.5)
            expect(value?.values.portionUnit).toBe('kg')
        })

        it('sem número nem unidade é sem medida', () => {
            const { value } = validate({ portionText: '', portionUnit: '' })

            expect(value?.values.portionAmount).toBeNull()
            expect(value?.values.portionUnit).toBeNull()
        })

        it('pede a unidade quando só o número foi informado', () => {
            expect(validate({ portionText: '300' }).errors.fields.portionUnit).toBeDefined()
        })

        it('pede o número quando só a unidade foi escolhida', () => {
            expect(validate({ portionUnit: 'g' }).errors.fields.portionText).toBeDefined()
        })

        it('recusa zero e texto', () => {
            expect(validate({ portionText: '0', portionUnit: 'g' }).errors.fields.portionText).toBeDefined()
            expect(validate({ portionText: 'muito', portionUnit: 'g' }).errors.fields.portionText).toBeDefined()
        })
    })

    describe('serve quantas pessoas', () => {
        it('vazio é opcional', () => {
            expect(validate({ servesText: '' }).value?.values.serves).toBeNull()
        })

        it('vai de 1 ao limite', () => {
            expect(validate({ servesText: '1' }).value?.values.serves).toBe(1)
            expect(validate({ servesText: String(SERVES_MAX) }).value?.values.serves).toBe(SERVES_MAX)
            expect(validate({ servesText: '0' }).errors.fields.servesText).toBeDefined()
            expect(validate({ servesText: String(SERVES_MAX + 1) }).errors.fields.servesText).toBeDefined()
            expect(validate({ servesText: '2,5' }).errors.fields.servesText).toBeDefined()
        })
    })

    describe('estoque', () => {
        it('vazio quer dizer sem controle', () => {
            expect(validate({ stockText: '' }).value?.values.stock).toBeNull()
        })

        it('aceita zero e inteiros positivos', () => {
            expect(validate({ stockText: '0' }).value?.values.stock).toBe(0)
            expect(validate({ stockText: '12' }).value?.values.stock).toBe(12)
        })

        it('recusa negativo, decimal e texto', () => {
            expect(validate({ stockText: '-1' }).errors.fields.stockText).toBeDefined()
            expect(validate({ stockText: '1,5' }).errors.fields.stockText).toBeDefined()
            expect(validate({ stockText: 'x' }).errors.fields.stockText).toBeDefined()
        })
    })

    describe('descrição', () => {
        it('aceita até o limite e recusa acima', () => {
            expect(validate({ description: 'a'.repeat(DESCRIPTION_MAX) }).errors.fields.description).toBeUndefined()
            expect(validate({ description: 'a'.repeat(DESCRIPTION_MAX + 1) }).errors.fields.description).toBeDefined()
        })

        it('vazia vira nula', () => {
            expect(validate({ description: '  ' }).value?.values.description).toBeNull()
        })
    })

    describe('mínimo e máximo dos adicionais', () => {
        it('lê os limites e guarda a ordem da lista', () => {
            const { value } = validate({
                links: [
                    { groupId: 'g1', minText: '1', maxText: '3' },
                    { groupId: 'g2', minText: '', maxText: '' },
                ],
            })

            expect(value?.links).toEqual([
                { groupId: 'g1', position: 0, minChoices: 1, maxChoices: 3 },
                { groupId: 'g2', position: 1, minChoices: 0, maxChoices: null },
            ])
        })

        it('recusa máximo menor que o mínimo, com o erro no grupo', () => {
            const { errors, value } = validate({ links: [{ groupId: 'g1', minText: '3', maxText: '2' }] })

            expect(value).toBeNull()
            expect(errors.links.g1.maxText).toBeDefined()
        })

        it('aceita máximo igual ao mínimo', () => {
            expect(validate({ links: [{ groupId: 'g1', minText: '2', maxText: '2' }] }).value).not.toBeNull()
        })

        it('recusa máximo zero, mínimo negativo e texto', () => {
            expect(validate({ links: [{ groupId: 'g1', minText: '0', maxText: '0' }] }).errors.links.g1.maxText).toBeDefined()
            expect(validate({ links: [{ groupId: 'g1', minText: '-1', maxText: '' }] }).errors.links.g1.minText).toBeDefined()
            expect(validate({ links: [{ groupId: 'g1', minText: 'a', maxText: 'b' }] }).errors.links.g1).toEqual({
                minText: expect.any(String),
                maxText: expect.any(String),
            })
        })
    })

    it('não devolve valor enquanto houver algum erro', () => {
        expect(validate({ name: '', priceText: '' }).value).toBeNull()
    })
})

describe('seleção obrigatória do grupo', () => {
    it('ligar põe o mínimo em pelo menos 1', () => {
        expect(setLinkRequired({ groupId: 'g', minText: '0', maxText: '' }, true).minText).toBe('1')
        expect(setLinkRequired({ groupId: 'g', minText: '2', maxText: '' }, true).minText).toBe('2')
    })

    it('desligar zera o mínimo', () => {
        expect(setLinkRequired({ groupId: 'g', minText: '2', maxText: '' }, false).minText).toBe('0')
    })

    it('é obrigatório quando o mínimo é 1 ou mais', () => {
        expect(isLinkRequired({ groupId: 'g', minText: '1', maxText: '' })).toBe(true)
        expect(isLinkRequired({ groupId: 'g', minText: '0', maxText: '' })).toBe(false)
    })
})

describe('rascunho', () => {
    const product: ManagedProduct = {
        id: 'p1',
        categoryId: 'category-1',
        name: 'X-Burger',
        description: null,
        priceCents: 2500,
        promoPriceCents: 2000,
        serves: 2,
        portionAmount: 1.5,
        portionUnit: 'kg',
        imageUrl: null,
        highlightTag: null,
        infoTags: [],
        allergenTags: [],
        stock: null,
        sellsDeliveryPickup: true,
        sellsTable: true,
        featured: false,
        active: true,
        position: 0,
        optionLinks: [
            { groupId: 'g2', position: 1, minChoices: 0, maxChoices: null },
            { groupId: 'g1', position: 0, minChoices: 1, maxChoices: 3 },
        ],
    }

    it('um produto salvo volta igual ao passar pelo formulário', () => {
        const { value } = validateProductDraft(draftFromProduct(product))

        expect(value?.values).toMatchObject({ priceCents: 2500, promoPriceCents: 2000, portionAmount: 1.5, serves: 2 })
        expect(value?.links.map((link) => link.groupId)).toEqual(['g1', 'g2'])
    })

    it('detecta alteração e volta a limpo ao desfazer', () => {
        const initial = draftFromProduct(product)

        expect(isDraftDirty(initial, initial)).toBe(false)
        expect(isDraftDirty(initial, { ...initial, name: 'Outro' })).toBe(true)
    })

    it('reordena a lista de grupos', () => {
        expect(moveItem(['a', 'b', 'c'], 2, 'up')).toEqual(['a', 'c', 'b'])
        expect(moveItem(['a', 'b', 'c'], 0, 'up')).toEqual(['a', 'b', 'c'])
    })
})

describe('prévia do cartão', () => {
    it('acompanha o que foi digitado', () => {
        const preview = buildPreviewProduct(
            buildDraft({ name: 'Suco', priceText: '10,00', promoText: '8,00', portionText: '500', portionUnit: 'ml' }),
        )

        expect(preview.name).toBe('Suco')
        expect(preview.priceCents).toBe(1000)
        expect(preview.promoPriceCents).toBe(800)
        expect(preview.portionLabel).toBe('500 ml')
    })

    it('tolera campos ainda incompletos', () => {
        const preview = buildPreviewProduct(createEmptyDraft('category-1'))

        expect(preview.priceCents).toBe(0)
        expect(preview.name.length).toBeGreaterThan(0)
    })

    it('ignora desconto que não fica abaixo do preço', () => {
        expect(buildPreviewProduct(buildDraft({ promoText: '30,00' })).promoPriceCents).toBeNull()
    })
})
