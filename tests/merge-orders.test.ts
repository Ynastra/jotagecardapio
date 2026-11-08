import { describe, expect, it } from 'vitest'

import { keepPinnedOrder, mergeFetchedWithRealtime } from '@/pages/panel-orders/model/merge-orders'

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

    it('tira da busca o pedido removido pelo tempo real durante a busca', () => {
        const staying = buildPanelOrder({ id: 'a', number: 1 })
        const removed = buildPanelOrder({ id: 'b', number: 2, status: 'preparing' })

        const merged = mergeFetchedWithRealtime([staying, removed], [], new Set(['b']))

        expect(merged.map((order) => order.id)).toEqual(['a'])
    })
})

describe('keepPinnedOrder', () => {
    const pinned = buildPanelOrder({ id: 'p', number: 5 })
    const other = buildPanelOrder({ id: 'o', number: 9 })

    it('devolve o pedido aberto à lista quando a junção o deixou de fora', () => {
        const kept = keepPinnedOrder([other], [pinned, other], 'p')

        expect(kept.map((order) => order.id)).toEqual(['o', 'p'])
    })

    it('não duplica o pedido aberto que já está na lista', () => {
        const kept = keepPinnedOrder([other, pinned], [pinned], 'p')

        expect(kept).toHaveLength(2)
    })

    it('não inventa pedido sem gaveta aberta ou que não estava na lista anterior', () => {
        expect(keepPinnedOrder([other], [pinned, other], null)).toEqual([other])
        expect(keepPinnedOrder([other], [other], 'p')).toEqual([other])
    })
})
