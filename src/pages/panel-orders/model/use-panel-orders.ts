import { useCallback, useEffect, useRef, useState } from 'react'

import type { OrderPaymentStatus, OrderStatus, PanelOrder } from '@/entities/order'
import { playNewOrderChime } from '@/shared/lib'

import { fetchOrderById, fetchOrders, saveOrderStatus, savePaymentStatus, subscribeToOrders } from '../api/panel-orders'
import { hasReachedQueryLimit, ORDERS_QUERY_LIMIT } from './board'
import { isVisibleInPeriod } from './filters'
import { mergeFetchedWithRealtime } from './merge-orders'
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
    const periodStartRef = useRef(periodStart)
    const fetchSequenceRef = useRef(0)
    const isFetchingRef = useRef(false)
    const arrivedDuringFetchRef = useRef(new Map<string, PanelOrder>())
    const isChannelSettledRef = useRef(false)
    const periodStartMs = periodStart.getTime()

    ordersRef.current = orders
    periodStartRef.current = periodStart

    const loadOrders = useCallback(async () => {
        const sequence = ++fetchSequenceRef.current
        isFetchingRef.current = true
        arrivedDuringFetchRef.current.clear()
        setLoading(true)

        try {
            const fetched = await fetchOrders({ storeId, since: new Date(periodStartMs), limit: ORDERS_QUERY_LIMIT })
            if (sequence !== fetchSequenceRef.current) {
                return
            }

            const arrived = Array.from(arrivedDuringFetchRef.current.values())
            setOrders(mergeFetchedWithRealtime(fetched, arrived))
            setTruncated(hasReachedQueryLimit(fetched.length))
            setErrorMessage(null)
        } catch (error) {
            console.error('Falha ao carregar pedidos', error)
            if (sequence === fetchSequenceRef.current) {
                setErrorMessage('Não deu para carregar os pedidos. Recarregue a página.')
            }
        } finally {
            if (sequence === fetchSequenceRef.current) {
                isFetchingRef.current = false
                arrivedDuringFetchRef.current.clear()
                setLoading(false)
            }
        }
    }, [storeId, periodStartMs])

    const loadOrdersRef = useRef(loadOrders)
    loadOrdersRef.current = loadOrders

    useEffect(() => {
        isChannelSettledRef.current = false

        function settleAndLoad() {
            isChannelSettledRef.current = true
            void loadOrdersRef.current()
        }

        const unsubscribe = subscribeToOrders(storeId, {
            onOrder: (order, isNew) => {
                if (!isVisibleInPeriod(order, periodStartRef.current)) {
                    setOrders((current) => current.filter((existing) => existing.id !== order.id))
                    return
                }

                if (isFetchingRef.current) {
                    arrivedDuringFetchRef.current.set(order.id, order)
                }
                setOrders((current) => upsertOrder(current, order))
                if (isNew) {
                    playNewOrderChime()
                }
            },
            onSubscribed: settleAndLoad,
            onFailed: () => {
                if (!isChannelSettledRef.current) {
                    settleAndLoad()
                }
            },
        })

        return unsubscribe
    }, [storeId])

    useEffect(() => {
        if (isChannelSettledRef.current) {
            void loadOrders()
        }
    }, [loadOrders])

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
