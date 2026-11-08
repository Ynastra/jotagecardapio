import { useEffect } from 'react'

import { useCurrentStore } from '@/entities/store'
import { Button, StatusMessage } from '@/shared/ui'

import { HOME_PERIOD_OPTIONS, type HomePeriodKey } from '../model/home-period'
import { useDashboard } from '../model/use-dashboard'
import { useHiddenValues } from '../model/hidden-values'
import { InProgressCard } from './InProgressCard'
import styles from './panel-home.module.css'
import { SummaryCards } from './SummaryCards'
import { TopProducts } from './TopProducts'

const SKELETON_CARD_COUNT = 7

export function PanelHomePage() {
    const store = useCurrentStore()
    const { period, setPeriod, status, dashboard, retry } = useDashboard(store.id, store.timezone)
    const { isHidden, toggle, formatMoney } = useHiddenValues()

    useEffect(() => {
        document.title = `Início · ${store.name}`
    }, [store.name])

    if (status === 'failed') {
        return (
            <StatusMessage illustration="painel-sem-pedidos" title="Não deu para abrir o Início">
                <p>Não deu para carregar os números da loja. Confira a internet.</p>
                <Button variant="secondary" onClick={retry}>
                    Tentar de novo
                </Button>
            </StatusMessage>
        )
    }

    const isLoading = status === 'loading' || dashboard === null

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Início</h1>
                <div className={styles.toolbar}>
                    <select
                        className={styles.period}
                        aria-label="Período"
                        value={period}
                        onChange={(event) => setPeriod(event.target.value as HomePeriodKey)}
                    >
                        {HOME_PERIOD_OPTIONS.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <Button variant="ghost" aria-pressed={isHidden} onClick={toggle}>
                        {isHidden ? 'Mostrar valores' : 'Ocultar valores'}
                    </Button>
                </div>
            </header>

            {isLoading ? (
                <div className={styles.cards} aria-busy="true">
                    {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
                        <div key={index} className={styles.skeleton} />
                    ))}
                </div>
            ) : (
                <>
                    {dashboard.ordersCount === 0 ? (
                        <p className={styles.notice}>Ainda sem pedidos neste período</p>
                    ) : null}
                    <SummaryCards dashboard={dashboard} formatMoney={formatMoney} />
                    <TopProducts
                        products={dashboard.topProducts}
                        itemsTotal={dashboard.itemsTotal}
                        formatMoney={formatMoney}
                    />
                    <InProgressCard count={dashboard.inProgressCount} />
                </>
            )}
        </div>
    )
}
