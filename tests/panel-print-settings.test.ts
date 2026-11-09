import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    DEFAULT_PRINT_SETTINGS,
    PRINTED_IDS_LIMIT,
    readPrintedIds,
    readPrintSettings,
    rememberPrintedId,
    shouldPrintOrder,
    writePrintedIds,
    writePrintSettings,
} from '@/pages/panel-orders/model/print-settings'
import { buildSampleOrder } from '@/pages/panel-orders/model/sample-order'

function stubBrowserStorage() {
    const data = new Map<string, string>()
    const localStorage = {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
    }
    vi.stubGlobal('window', { localStorage })
    return data
}

describe('configuração de impressão', () => {
    beforeEach(() => {
        stubBrowserStorage()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('começa desligada, com 2 vias', () => {
        expect(readPrintSettings('loja-1')).toEqual({ autoPrint: false, copies: 2 })
        expect(DEFAULT_PRINT_SETTINGS).toEqual({ autoPrint: false, copies: 2 })
    })

    it('lembra a configuração separada por loja', () => {
        writePrintSettings('loja-1', { autoPrint: true, copies: 1 })

        expect(readPrintSettings('loja-1')).toEqual({ autoPrint: true, copies: 1 })
        expect(readPrintSettings('loja-2')).toEqual({ autoPrint: false, copies: 2 })
    })

    it('volta ao padrão quando o valor guardado é inválido', () => {
        const data = stubBrowserStorage()
        data.set('jgcardapio:painel-pedidos:impressao:loja-1', JSON.stringify({ autoPrint: 'sim', copies: 7 }))

        expect(readPrintSettings('loja-1')).toEqual({ autoPrint: false, copies: 2 })
    })

    it('lembra os ids impressos por loja e ignora lixo', () => {
        writePrintedIds('loja-1', ['a', 'b'])

        expect(readPrintedIds('loja-1')).toEqual(['a', 'b'])
        expect(readPrintedIds('loja-2')).toEqual([])

        const data = stubBrowserStorage()
        data.set('jgcardapio:painel-pedidos:impressos:loja-1', JSON.stringify({ a: 1 }))
        expect(readPrintedIds('loja-1')).toEqual([])
    })
})

describe('rememberPrintedId', () => {
    it('acrescenta o id novo no fim', () => {
        expect(rememberPrintedId(['a'], 'b')).toEqual(['a', 'b'])
    })

    it('não repete um id já registrado', () => {
        expect(rememberPrintedId(['a', 'b'], 'a')).toEqual(['a', 'b'])
    })

    it('guarda só os mais recentes', () => {
        const ids = Array.from({ length: PRINTED_IDS_LIMIT }, (_, index) => `pedido-${index}`)

        const remembered = rememberPrintedId(ids, 'novo')

        expect(remembered).toHaveLength(PRINTED_IDS_LIMIT)
        expect(remembered[0]).toBe('pedido-1')
        expect(remembered.at(-1)).toBe('novo')
    })
})

describe('shouldPrintOrder', () => {
    const on = { autoPrint: true, copies: 2 } as const

    it('imprime pedido novo com a automática ligada', () => {
        expect(shouldPrintOrder(on, ['a'], 'b')).toBe(true)
    })

    it('não imprime com a automática desligada', () => {
        expect(shouldPrintOrder({ autoPrint: false, copies: 2 }, [], 'b')).toBe(false)
    })

    it('não imprime duas vezes o mesmo pedido', () => {
        expect(shouldPrintOrder(on, ['b'], 'b')).toBe(false)
    })
})

describe('buildSampleOrder', () => {
    const order = buildSampleOrder(new Date('2026-11-09T15:00:00Z'))

    it('é uma entrega com opcionais, observação e endereço', () => {
        expect(order.fulfillment).toBe('delivery')
        expect(order.address).not.toBeNull()
        expect(order.notes).toBeTruthy()
        expect(order.items.some((item) => item.options.length > 0)).toBe(true)
        expect(order.items.some((item) => item.notes)).toBe(true)
    })

    it('tem totais que fecham', () => {
        const itemsTotal = order.items.reduce((sum, item) => sum + item.totalCents, 0)

        expect(itemsTotal).toBe(order.subtotalCents)
        expect(order.subtotalCents + order.deliveryFeeCents + order.paymentFeeCents).toBe(order.totalCents)
    })

    it('usa o instante recebido como hora do pedido', () => {
        expect(order.createdAt).toBe('2026-11-09T15:00:00.000Z')
    })
})
