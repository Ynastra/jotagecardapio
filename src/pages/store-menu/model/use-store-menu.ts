import { useEffect, useState } from 'react'

import { fetchStoreMenu } from '../api/fetch-store-menu'
import type { StoreMenu } from './types'

export type StoreMenuState =
    | { status: 'loading' }
    | { status: 'ready'; menu: StoreMenu }
    | { status: 'not-found' }
    | { status: 'error' }

export function useStoreMenu(slug: string): StoreMenuState {
    const [state, setState] = useState<StoreMenuState>({ status: 'loading' })

    useEffect(() => {
        let isCurrent = true
        setState({ status: 'loading' })

        fetchStoreMenu(slug)
            .then((menu) => {
                if (isCurrent) {
                    setState(menu ? { status: 'ready', menu } : { status: 'not-found' })
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar o cardápio', error)
                if (isCurrent) {
                    setState({ status: 'error' })
                }
            })

        return () => {
            isCurrent = false
        }
    }, [slug])

    return state
}
