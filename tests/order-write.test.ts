import { describe, expect, it } from 'vitest'

import { ORDER_CONFLICT_MESSAGE, resolveOrderWrite } from '@/pages/panel-orders/model/order-write'

import { buildPanelOrder } from './fixtures/panel-order'

describe('resolveOrderWrite', () => {
    it('usa a linha devolvida pelo banco como novo estado do pedido', () => {
        const saved = buildPanelOrder({ status: 'preparing', preparingAt: '2026-11-07T15:10:00Z' })

        expect(resolveOrderWrite(saved)).toEqual({ kind: 'saved', order: saved })
    })

    it('trata a falta de linha como pedido mudado em outro aparelho', () => {
        expect(resolveOrderWrite(null)).toEqual({ kind: 'conflict', message: ORDER_CONFLICT_MESSAGE })
        expect(ORDER_CONFLICT_MESSAGE).toBe('Este pedido mudou em outro aparelho. Confira o status atual.')
    })
})
