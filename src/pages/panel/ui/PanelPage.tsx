import { useEffect, useState } from 'react'

import { supabase } from '@/shared/api'
import { ThemeProvider } from '@/shared/lib'
import { Button, StatusMessage, ThemeIcon } from '@/shared/ui'

import { fetchMyStores, type PanelStore } from '../api/panel'
import { unlockChime } from '../model/chime'
import { isActiveOrder } from '../model/order-flow'
import { usePanelOrders } from '../model/use-panel-orders'
import { useSession } from '../model/use-session'
import { LoginForm } from './LoginForm'
import { OrderCard } from './OrderCard'
import styles from './panel.module.css'

function StoreOrders({ store }: { store: PanelStore }) {
    const { orders, isLoading, errorMessage, changeStatus } = usePanelOrders(store.id)
    const activeOrders = orders.filter(isActiveOrder)
    const finishedOrders = orders.filter((order) => !isActiveOrder(order))

    useEffect(() => {
        document.title = activeOrders.length > 0 ? `(${activeOrders.length}) Pedidos · ${store.name}` : `Pedidos · ${store.name}`
    }, [activeOrders.length, store.name])

    return (
        <div className={styles.board} onPointerDown={unlockChime}>
            <header className={styles.boardHeader}>
                <h1 className={styles.boardTitle}>
                    <ThemeIcon name="pedidos" size={26} />
                    {store.name}
                </h1>
                <a className={styles.storeLink} href={`/${store.slug}`} target="_blank" rel="noopener noreferrer">
                    Ver cardápio
                </a>
                <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
                    <ThemeIcon name="sair" size={18} />
                    Sair
                </Button>
            </header>

            {errorMessage ? (
                <p className={styles.error} role="alert">
                    {errorMessage}
                </p>
            ) : null}
            {isLoading ? <p className={styles.muted}>Carregando pedidos</p> : null}
            {!isLoading && orders.length === 0 ? (
                <StatusMessage illustration="painel-sem-pedidos" title="Nenhum pedido ainda">
                    <p>Os pedidos aparecem aqui na hora, com um aviso sonoro.</p>
                </StatusMessage>
            ) : null}

            {activeOrders.length > 0 ? (
                <section className={styles.column}>
                    <h2 className={styles.columnTitle}>Em andamento</h2>
                    {activeOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onChangeStatus={changeStatus} />
                    ))}
                </section>
            ) : null}
            {finishedOrders.length > 0 ? (
                <section className={styles.column}>
                    <h2 className={styles.columnTitle}>Finalizados</h2>
                    {finishedOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onChangeStatus={changeStatus} />
                    ))}
                </section>
            ) : null}
        </div>
    )
}

function StorePicker() {
    const [stores, setStores] = useState<PanelStore[] | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        fetchMyStores()
            .then(setStores)
            .catch((error: unknown) => {
                console.error('Falha ao carregar lojas', error)
                setStores([])
            })
    }, [])

    if (stores === null) {
        return <p className={styles.muted}>Carregando</p>
    }
    if (stores.length === 0) {
        return (
            <StatusMessage illustration="nao-encontrado" title="Nenhuma loja nesta conta">
                <p>Peça para a JG Cardápio vincular a sua loja a este e-mail.</p>
                <Button variant="secondary" onClick={() => supabase.auth.signOut()}>
                    Sair
                </Button>
            </StatusMessage>
        )
    }

    const selected = stores.find((store) => store.id === selectedId) ?? (stores.length === 1 ? stores[0] : null)
    if (selected) {
        return <StoreOrders store={selected} />
    }

    return (
        <div className={styles.login}>
            <h1 className={styles.loginTitle}>Escolha a loja</h1>
            {stores.map((store) => (
                <Button key={store.id} variant="secondary" wide onClick={() => setSelectedId(store.id)}>
                    {store.name}
                </Button>
            ))}
        </div>
    )
}

export function PanelPage() {
    const session = useSession()

    useEffect(() => {
        document.title = 'Painel · JG Cardápio'
    }, [])

    return (
        <ThemeProvider folders={['base']}>
            <div className={styles.page}>
                {session === undefined ? <p className={styles.muted}>Carregando</p> : null}
                {session === null ? <LoginForm /> : null}
                {session ? <StorePicker /> : null}
            </div>
        </ThemeProvider>
    )
}
