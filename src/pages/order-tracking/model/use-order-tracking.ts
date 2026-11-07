import { useEffect, useState } from 'react'

import { fetchOrderTracking } from '../api/fetch-order-tracking'
import type { OrderTracking } from './types'

const REFRESH_INTERVAL_MS = 30_000

export type OrderTrackingState =
    | { status: 'loading' }
    | { status: 'ready'; tracking: OrderTracking }
    | { status: 'not-found' }
    | { status: 'error' }

// O visitante não tem acesso ao realtime de pedidos, então a página consulta de
// novo a cada intervalo, só com a aba visível, e ao voltar para ela.
export function useOrderTracking(token: string): OrderTrackingState {
    const [state, setState] = useState<OrderTrackingState>({ status: 'loading' })

    useEffect(() => {
        let isCurrent = true
        setState({ status: 'loading' })

        async function load() {
            try {
                const tracking = await fetchOrderTracking(token)

                if (isCurrent) {
                    setState(tracking ? { status: 'ready', tracking } : { status: 'not-found' })
                }
            } catch (error) {
                console.error('Falha ao carregar o acompanhamento do pedido', error)

                // Uma falha numa atualização não derruba o que já está na tela.
                if (isCurrent) {
                    setState((current) => (current.status === 'ready' ? current : { status: 'error' }))
                }
            }
        }

        function refreshIfVisible() {
            if (document.visibilityState === 'visible') {
                void load()
            }
        }

        void load()
        const interval = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS)
        document.addEventListener('visibilitychange', refreshIfVisible)

        return () => {
            isCurrent = false
            window.clearInterval(interval)
            document.removeEventListener('visibilitychange', refreshIfVisible)
        }
    }, [token])

    return state
}
