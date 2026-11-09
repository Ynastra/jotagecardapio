import { describe, expect, it } from 'vitest'

import type { OrderLineOption } from '@/entities/order'
import { listOptionAnswers } from '@/pages/panel-orders/model/option-groups'

function buildOption(overrides: Partial<OrderLineOption>): OrderLineOption {
    const option: OrderLineOption = {
        optionId: 'op1',
        groupTitle: 'Ponto da carne',
        name: 'Ao ponto',
        quantity: 1,
        unitPriceCents: 0,
        ...overrides,
    }
    return option
}

describe('listOptionAnswers', () => {
    it('lista só as respostas, sem o título do grupo, na ordem do item', () => {
        const answers = listOptionAnswers([
            buildOption({ name: 'Ao ponto' }),
            buildOption({ groupTitle: 'Molhos', name: 'Maionese da Casa' }),
        ])

        expect(answers).toEqual(['Ao ponto', 'Maionese da Casa'])
    })

    it('põe a quantidade na frente quando passa de 1', () => {
        const answers = listOptionAnswers([buildOption({ name: 'Bacon extra', quantity: 2 })])

        expect(answers).toEqual(['2x Bacon extra'])
    })

    it('devolve lista vazia sem opcionais', () => {
        expect(listOptionAnswers([])).toEqual([])
    })
})
