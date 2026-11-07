import { useCallback, useEffect, useState } from 'react'

import type { OrderPaymentStatus, OrderStatus, PanelOrder } from '@/entities/order'
import { playNewOrderChime } from '@/shared/lib'

import { fetchOrders, subscribeToOrders, updateOrderStatus, updatePaymentStatus } from '../api/panel-orders'
import { hasReachedQueryLimit, ORDERS_QUERY_LIMIT } from './board'
import { upsertOrder } from './order-flow'

export type PanelOrdersState = {
    orders: PanelOrder[]
    isLoading: boolean
    isTruncated: boolean
    errorMessage: string | null
    changeStatus: (orderId: string, status: OrderStatus) => Promise<void>
    changePaymentStatus: (orderId: string, paymentStatus: OrderPaymentStatus) => Promise<void>
}

export function usePanelOrders(storeId: string, periodStart: Date): PanelOrdersState {
    const [orders, setOrders] = useState<PanelOrder[]>([])
    const [isLoading, setLoading] = useState(true)
    const [isTruncated, setTruncated] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const periodStartMs = periodStart.getTime()

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

    const changeStatus = useCallback(async (orderId: string, status: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, status)
            setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)))
            setErrorMessage(null)
        } catch (error) {
            console.error('Falha ao mudar status', error)
            setErrorMessage('Não deu para mudar o status. Confira a internet e tente de novo.')
        }
    }, [])

    const changePaymentStatus = useCallback(async (orderId: string, paymentStatus: OrderPaymentStatus) => {
        try {
            await updatePaymentStatus(orderId, paymentStatus)
            setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, paymentStatus } : order)))
            setErrorMessage(null)
        } catch (error) {
            console.error('Falha ao mudar pagamento', error)
            setErrorMessage('Não deu para mudar o pagamento. Confira a internet e tente de novo.')
        }
    }, [])

    return { orders, isLoading, isTruncated, errorMessage, changeStatus, changePaymentStatus }
}
