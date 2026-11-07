import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { CurrentStoreProvider, fetchMyStores, type Store } from '@/entities/store'
import { supabase } from '@/shared/api'
import { ThemeProvider } from '@/shared/lib'
import { Button, StatusMessage } from '@/shared/ui'

import { LoginForm } from './LoginForm'
import { PanelMenu } from './PanelMenu'
import styles from './panel-layout.module.css'
import { useSession } from './use-session'

function StoreShell({ store }: { store: Store }) {
    const [isMenuOpen, setMenuOpen] = useState(false)

    return (
        <CurrentStoreProvider store={store}>
            <div className={styles.shell}>
                <PanelMenu store={store} isOpen={isMenuOpen} onNavigate={() => setMenuOpen(false)} />
                {isMenuOpen ? (
                    <button type="button" className={styles.menuBackdrop} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />
                ) : null}
                <div>
                    <div className={styles.topBar}>
                        <button type="button" className={styles.menuToggle} onClick={() => setMenuOpen(true)}>
                            Menu
                        </button>
                        <strong>{store.name}</strong>
                    </div>
                    <main className={styles.content}>
                        <Outlet />
                    </main>
                </div>
            </div>
        </CurrentStoreProvider>
    )
}

function StorePicker() {
    const [stores, setStores] = useState<Store[] | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        fetchMyStores()
            .then(setStores)
            .catch((error: unknown) => {
                console.error('Falha ao carregar lojas', error)
                setStores([])
            })
    }, [])

    const selected = stores?.find((store) => store.id === selectedId) ?? (stores?.length === 1 ? stores[0] : null)

    useEffect(() => {
        if (!selected) {
            document.title = 'Painel · JG Cardápio'
        }
    }, [selected])

    if (stores === null) {
        return (
            <div className={styles.page}>
                <p className={styles.muted}>Carregando</p>
            </div>
        )
    }
    if (stores.length === 0) {
        return (
            <div className={styles.page}>
                <StatusMessage illustration="nao-encontrado" title="Nenhuma loja nesta conta">
                    <p>Peça para a JG Cardápio vincular a sua loja a este e-mail.</p>
                    <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
                        Sair
                    </Button>
                </StatusMessage>
            </div>
        )
    }
    if (selected) {
        return <StoreShell store={selected} />
    }

    return (
        <div className={styles.page}>
            <div className={styles.login}>
                <h1 className={styles.loginTitle}>Escolha a loja</h1>
                {stores.map((store) => (
                    <Button key={store.id} variant="secondary" wide onClick={() => setSelectedId(store.id)}>
                        {store.name}
                    </Button>
                ))}
            </div>
        </div>
    )
}

export function PanelLayout() {
    const session = useSession()

    useEffect(() => {
        document.title = 'Painel · JG Cardápio'
    }, [])

    return (
        <ThemeProvider folders={['base']}>
            {session === undefined ? (
                <div className={styles.page}>
                    <p className={styles.muted}>Carregando</p>
                </div>
            ) : null}
            {session === null ? (
                <div className={styles.page}>
                    <LoginForm />
                </div>
            ) : null}
            {session ? <StorePicker /> : null}
        </ThemeProvider>
    )
}
