import { createContext, useContext, useMemo, type ReactNode } from 'react'

import type { Store } from './types'

type CurrentStoreValue = {
    store: Store
    reload: () => Promise<void>
}

type CurrentStoreProviderProps = {
    store: Store
    onReload: () => Promise<void>
    children: ReactNode
}

const CurrentStoreContext = createContext<CurrentStoreValue | null>(null)

export function CurrentStoreProvider({ store, onReload, children }: CurrentStoreProviderProps) {
    const value = useMemo(() => ({ store, reload: onReload }), [store, onReload])
    return <CurrentStoreContext.Provider value={value}>{children}</CurrentStoreContext.Provider>
}

function useCurrentStoreValue(): CurrentStoreValue {
    const value = useContext(CurrentStoreContext)
    if (!value) {
        throw new Error('useCurrentStore precisa estar dentro de CurrentStoreProvider')
    }
    return value
}

export function useCurrentStore(): Store {
    const { store } = useCurrentStoreValue()
    return store
}

// Busca a loja de novo depois de salvar, para o nome no topo do painel acompanhar.
export function useReloadCurrentStore(): () => Promise<void> {
    const { reload } = useCurrentStoreValue()
    return reload
}
