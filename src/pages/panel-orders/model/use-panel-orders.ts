import { useCallback, useEffect, useState } from 'react'

import type { OrderStatus, PanelOrder } from '@/entities/order'
import { playNewOrderChime } from '@/shared/lib'

import { fetchRecentOrders, subscribeToOrders, updateOrderStatus } from '../api/panel-orders'
import { upsertOrder } from './order-flow'

export type PanelOrdersState = {
    orders: PanelOrder[]
    isLoading: boolean
    errorMessage: string | null
    changeStatus: (orderId: string, status: OrderStatus) => Promise<void>
}

export function usePanelOrders(storeId: string): PanelOrdersState {
    const [orders, setOrders] = useState<PanelOrder[]>([])
    const [isLoading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        let isCurrent = true
        setLoading(true)

        fetchRecentOrders(storeId)
            .then((loaded) => {
                if (isCurrent) {
                    setOrders(loaded)
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

        const unsubscribe = subscribeToOrders(storeId, (order, isNew) => {
            setOrders((current) => upsertOrder(current, order))
            if (isNew) {
                playNewOrderChime()
            }
        })

        return () => {
            isCurrent = false
            unsubscribe()
        }
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

    return { orders, isLoading, errorMessage, changeStatus }
}
