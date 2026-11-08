import { useEffect, useRef } from 'react'

import type { PanelOrder } from '@/entities/order'

import { fetchOrderById } from '../api/panel-orders'

export type LinkedOrderFailure = 'not-found' | 'failed'

type LinkedOrderOptions = {
    storeId: string
    orderId: string | null
    isListed: boolean
    isBoardLoading: boolean
    onFound: (order: PanelOrder) => void
    onMissing: (failure: LinkedOrderFailure) => void
}

// Um endereço com `?pedido=` pode apontar para um pedido que a lista carregada
// não traz (por exemplo, concluído em outro período); nesse caso ele é buscado
// pelo id, restrito à loja atual.
export function useLinkedOrder({
    storeId,
    orderId,
    isListed,
    isBoardLoading,
    onFound,
    onMissing,
}: LinkedOrderOptions): void {
    const handlersRef = useRef({ onFound, onMissing })
    handlersRef.current = { onFound, onMissing }

    useEffect(() => {
        if (!orderId || isListed || isBoardLoading) {
            return
        }

        let isCurrent = true

        fetchOrderById(storeId, orderId)
            .then((order) => {
                if (!isCurrent) {
                    return
                }
                if (order) {
                    handlersRef.current.onFound(order)
                } else {
                    handlersRef.current.onMissing('not-found')
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao buscar o pedido do endereço', error)
                if (isCurrent) {
                    handlersRef.current.onMissing('failed')
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, orderId, isListed, isBoardLoading])
}
