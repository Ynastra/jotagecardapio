import { useEffect, useMemo } from 'react'

import { useCurrentStore } from '@/entities/store'
import { unlockChime } from '@/shared/lib'
import { StatusMessage, ThemeIcon } from '@/shared/ui'

import { isActiveOrder } from '../model/order-flow'
import { getPeriodStart } from '../model/period'
import { usePanelOrders } from '../model/use-panel-orders'
import { OrderCard } from './OrderCard'
import styles from './panel-orders.module.css'

export function PanelOrdersPage() {
    const store = useCurrentStore()
    const periodStart = useMemo(() => getPeriodStart('today', new Date(), store.timezone), [store.timezone])
    const { orders, isLoading, errorMessage, changeStatus } = usePanelOrders(store.id, periodStart)
    const activeOrders = orders.filter(isActiveOrder)
    const finishedOrders = orders.filter((order) => !isActiveOrder(order))

    useEffect(() => {
        document.title = activeOrders.length > 0 ? `(${activeOrders.length}) Pedidos · ${store.name}` : `Pedidos · ${store.name}`
    }, [activeOrders.length, store.name])

    return (
        <div className={styles.board} onPointerDown={unlockChime}>
            <h1 className={styles.boardTitle}>
                <ThemeIcon name="pedidos" size={26} />
                Pedidos
            </h1>

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
