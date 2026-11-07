import { describe, expect, it } from 'vitest'

import {
    groupOrdersIntoColumns,
    hasReachedQueryLimit,
    ORDERS_QUERY_LIMIT,
    sumCompletedCents,
} from '@/pages/panel-orders/model/board'
import { filterOrders, type OrderFilters } from '@/pages/panel-orders/model/filters'

import { buildPanelOrder } from './fixtures/panel-order'

const baseFilters: OrderFilters = {
    channel: 'all',
    search: '',
    periodStart: new Date('2026-11-07T03:00:00Z'),
}

describe('filterOrders', () => {
    const delivery = buildPanelOrder({ id: 'a', number: 1, publicCode: '001-111111', fulfillment: 'delivery' })
    const pickup = buildPanelOrder({
        id: 'b',
        number: 2,
        publicCode: '002-222222',
        fulfillment: 'pickup',
        customerName: 'João Álvares',
    })

    it('filtra por canal', () => {
        const orders = [delivery, pickup]

        expect(filterOrders(orders, { ...baseFilters, channel: 'delivery' })).toEqual([delivery])
        expect(filterOrders(orders, { ...baseFilters, channel: 'pickup' })).toEqual([pickup])
        expect(filterOrders(orders, baseFilters)).toEqual(orders)
    })

    it('busca pelo nome sem diferenciar caixa nem acento', () => {
        const orders = [delivery, pickup]

        expect(filterOrders(orders, { ...baseFilters, search: 'joao alv' })).toEqual([pickup])
        expect(filterOrders(orders, { ...baseFilters, search: 'MARIA' })).toEqual([delivery])
    })

    it('busca pelo código público ou pelo número do pedido', () => {
        const orders = [delivery, pickup]

        expect(filterOrders(orders, { ...baseFilters, search: '222222' })).toEqual([pickup])
        expect(filterOrders(orders, { ...baseFilters, search: '#1' })).toEqual([delivery])
    })

    it('esconde pedido anterior ao início do período', () => {
        const old = buildPanelOrder({ id: 'c', createdAt: '2026-11-07T02:59:59Z' })
        const first = buildPanelOrder({ id: 'd', createdAt: '2026-11-07T03:00:00Z' })

        expect(filterOrders([old, first], baseFilters)).toEqual([first])
    })
})

describe('groupOrdersIntoColumns', () => {
    it('agrupa concluídos e cancelados na última coluna', () => {
        const received = buildPanelOrder({ id: 'a', status: 'received' })
        const preparing = buildPanelOrder({ id: 'b', status: 'preparing' })
        const ready = buildPanelOrder({ id: 'c', status: 'ready' })
        const completed = buildPanelOrder({ id: 'd', status: 'completed' })
        const canceled = buildPanelOrder({ id: 'e', status: 'canceled' })

        const columns = groupOrdersIntoColumns([received, preparing, ready, completed, canceled])

        expect(columns).toEqual({
            received: [received],
            preparing: [preparing],
            ready: [ready],
            finished: [completed, canceled],
        })
    })
})

describe('sumCompletedCents', () => {
    it('soma só os pedidos concluídos, sem cancelados nem em andamento', () => {
        const orders = [
            buildPanelOrder({ id: 'a', status: 'completed', totalCents: 2500 }),
            buildPanelOrder({ id: 'b', status: 'completed', totalCents: 1500 }),
            buildPanelOrder({ id: 'c', status: 'canceled', totalCents: 9000 }),
            buildPanelOrder({ id: 'd', status: 'preparing', totalCents: 700 }),
        ]

        expect(sumCompletedCents(orders)).toBe(4000)
    })

    it('é zero sem pedidos concluídos', () => {
        expect(sumCompletedCents([])).toBe(0)
    })
})

describe('hasReachedQueryLimit', () => {
    it('avisa só quando a consulta bateu no teto', () => {
        expect(hasReachedQueryLimit(ORDERS_QUERY_LIMIT - 1)).toBe(false)
        expect(hasReachedQueryLimit(ORDERS_QUERY_LIMIT)).toBe(true)
    })
})
