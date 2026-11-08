import { useCallback, useEffect, useRef, useState } from 'react'

import type { OrderPaymentStatus, OrderStatus, PanelOrder } from '@/entities/order'
import { playNewOrderChime } from '@/shared/lib'

import { fetchOrderById, fetchOrders, saveOrderStatus, savePaymentStatus, subscribeToOrders } from '../api/panel-orders'
import { hasReachedQueryLimit, ORDERS_QUERY_LIMIT } from './board'
import { upsertOrder } from './order-flow'
import { resolveOrderWrite } from './order-write'

export type PanelOrdersState = {
    orders: PanelOrder[]
    isLoading: boolean
    isTruncated: boolean
    errorMessage: string | null
    pendingOrderIds: ReadonlySet<string>
    changeStatus: (orderId: string, status: OrderStatus) => Promise<void>
    changePaymentStatus: (orderId: string, paymentStatus: OrderPaymentStatus) => Promise<void>
}

export function usePanelOrders(storeId: string, periodStart: Date): PanelOrdersState {
    const [orders, setOrders] = useState<PanelOrder[]>([])
    const [isLoading, setLoading] = useState(true)
    const [isTruncated, setTruncated] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [pendingOrderIds, setPendingOrderIds] = useState<ReadonlySet<string>>(new Set())
    const pendingRef = useRef(new Set<string>())
    const ordersRef = useRef<PanelOrder[]>([])
    const periodStartMs = periodStart.getTime()

    ordersRef.current = orders

    useEffect(() => {
        let isCurrent = true
        setLoading(true)

        fetchOrders({ storeId, since: new Date(periodStartMs), limit: ORDERS_QUERY_LIMIT })
            .then((loaded) => {
                if (isCurrent) {
                    setOrders(loaded)
                    setTruncated(hasReachedQueryLimit(loaded.length))
                    setErrorMessage(null)
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar pedidos', error)
                if (isCurrent) {
                    setErrorMessage('Não deu para carregar os pedidos. Recarregue a página.')
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false)
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, periodStartMs])

    useEffect(() => {
        const unsubscribe = subscribeToOrders(storeId, (order, isNew) => {
            setOrders((current) => upsertOrder(current, order))
            if (isNew) {
                playNewOrderChime()
            }
        })

        return unsubscribe
    }, [storeId])

    const runOrderWrite = useCallback(
        async (orderId: string, save: (current: PanelOrder) => Promise<PanelOrder | null>, failureMessage: string) => {
            const current = ordersRef.current.find((order) => order.id === orderId)
            if (!current || pendingRef.current.has(orderId)) {
                return
            }

            pendingRef.current.add(orderId)
            setPendingOrderIds(new Set(pendingRef.current))

            try {
                const resolution = resolveOrderWrite(await save(current))
                if (resolution.kind === 'saved') {
                    setOrders((existing) => upsertOrder(existing, resolution.order))
                    setErrorMessage(null)
                } else {
                    setErrorMessage(resolution.message)
                    const fresh = await fetchOrderById(orderId)
                    if (fresh) {
                        setOrders((existing) => upsertOrder(existing, fresh))
                    }
                }
            } catch (error) {
                console.error('Falha ao gravar o pedido', error)
                setErrorMessage(failureMessage)
            } finally {
                pendingRef.current.delete(orderId)
                setPendingOrderIds(new Set(pendingRef.current))
            }
        },
        [],
    )

    const changeStatus = useCallback(
        (orderId: string, status: OrderStatus) => {
            const result = runOrderWrite(
                orderId,
                (current) => saveOrderStatus(orderId, current.status, status),
                'Não deu para mudar o status. Confira a internet e tente de novo.',
            )
            return result
        },
        [runOrderWrite],
    )

    const changePaymentStatus = useCallback(
        (orderId: string, paymentStatus: OrderPaymentStatus) => {
            const result = runOrderWrite(
                orderId,
                (current) => savePaymentStatus(orderId, current.paymentStatus, paymentStatus),
                'Não deu para mudar o pagamento. Confira a internet e tente de novo.',
            )
            return result
        },
        [runOrderWrite],
    )

    return { orders, isLoading, isTruncated, errorMessage, pendingOrderIds, changeStatus, changePaymentStatus }
}
