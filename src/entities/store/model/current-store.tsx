import { createContext, useContext, type ReactNode } from 'react'

import type { Store } from './types'

const CurrentStoreContext = createContext<Store | null>(null)

export function CurrentStoreProvider({ store, children }: { store: Store; children: ReactNode }) {
    return <CurrentStoreContext.Provider value={store}>{children}</CurrentStoreContext.Provider>
}

export function useCurrentStore(): Store {
    const store = useContext(CurrentStoreContext)
    if (!store) {
        throw new Error('useCurrentStore precisa estar dentro de CurrentStoreProvider')
    }
    return store
}
