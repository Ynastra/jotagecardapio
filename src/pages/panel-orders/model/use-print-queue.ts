import { useCallback, useRef, useState } from 'react'

import type { PanelOrder } from '@/entities/order'

import {
    readPrintedIds,
    readPrintSettings,
    rememberPrintedId,
    shouldPrintOrder,
    writePrintedIds,
} from './print-settings'

export type QueuedPrint = {
    key: string
    order: PanelOrder
    copies: number
}

export type PrintQueue = {
    currentJob: QueuedPrint | null
    printOrder: (order: PanelOrder, copies: number) => void
    printNewOrder: (order: PanelOrder) => void
    finishJob: () => void
}

// As comandas saem uma depois da outra: só o primeiro da fila vai para a
// estação de impressão, e o próximo entra quando ele termina.
export function usePrintQueue(storeId: string): PrintQueue {
    const [queue, setQueue] = useState<QueuedPrint[]>([])
    const jobCounterRef = useRef(0)

    const printOrder = useCallback((order: PanelOrder, copies: number) => {
        jobCounterRef.current += 1
        const job = { key: `${order.id}-${jobCounterRef.current}`, order, copies }
        setQueue((current) => [...current, job])
    }, [])

    const printNewOrder = useCallback(
        (order: PanelOrder) => {
            const settings = readPrintSettings(storeId)
            const printedIds = readPrintedIds(storeId)
            if (!shouldPrintOrder(settings, printedIds, order.id)) {
                return
            }

            writePrintedIds(storeId, rememberPrintedId(printedIds, order.id))
            printOrder(order, settings.copies)
        },
        [storeId, printOrder],
    )

    const finishJob = useCallback(() => {
        setQueue((current) => current.slice(1))
    }, [])

    const currentJob = queue[0] ?? null

    return { currentJob, printOrder, printNewOrder, finishJob }
}
