import { describe, expect, it } from 'vitest'

import { mergeFetchedWithRealtime } from '@/pages/panel-orders/model/merge-orders'

import { buildPanelOrder } from './fixtures/panel-order'

describe('mergeFetchedWithRealtime', () => {
    it('mantém o pedido que chegou pelo tempo real durante a busca e a busca não trouxe', () => {
        const fetched = [buildPanelOrder({ id: 'a', number: 1 })]
        const arrived = buildPanelOrder({ id: 'b', number: 2 })

        const merged = mergeFetchedWithRealtime(fetched, [arrived])

        expect(merged.map((order) => order.id)).toEqual(['b', 'a'])
    })

    it('prefere a versão do tempo real quando os dois trazem o mesmo pedido', () => {
        const stale = buildPanelOrder({ id: 'a', number: 1, status: 'received' })
        const fresh = buildPanelOrder({ id: 'a', number: 1, status: 'preparing' })

        const merged = mergeFetchedWithRealtime([stale], [fresh])

        expect(merged).toEqual([fresh])
    })

    it('devolve a busca intacta, do mais novo para o mais antigo, sem eventos', () => {
        const older = buildPanelOrder({ id: 'a', number: 1 })
        const newer = buildPanelOrder({ id: 'b', number: 2 })

        const merged = mergeFetchedWithRealtime([older, newer], [])

        expect(merged.map((order) => order.id)).toEqual(['b', 'a'])
    })
})
