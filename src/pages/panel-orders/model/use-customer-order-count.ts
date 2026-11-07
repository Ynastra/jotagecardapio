import { useEffect, useState } from 'react'

import { countCustomerOrders } from '../api/panel-orders'

// Nulo enquanto a contagem não chegou (ou se a consulta falhou).
export function useCustomerOrderCount(storeId: string, customerPhone: string): number | null {
    const [count, setCount] = useState<number | null>(null)

    useEffect(() => {
        let isCurrent = true
        setCount(null)

        countCustomerOrders(storeId, customerPhone)
            .then((total) => {
                if (isCurrent) {
                    setCount(total)
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao contar pedidos do cliente', error)
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, customerPhone])

    return count
}
