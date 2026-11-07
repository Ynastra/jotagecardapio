import { useState } from 'react'

import { formatCents } from '@/shared/lib'
import { ThemeIcon, ThemeImage } from '@/shared/ui'

import { describeWeek, getLocalClock } from '../model/opening-hours'
import type { Store } from '../model/types'
import styles from './store-header.module.css'

type StoreHeaderProps = {
    store: Store
    isOpen: boolean
}

export function StoreHeader({ store, isOpen }: StoreHeaderProps) {
    const [showHours, setShowHours] = useState(false)
    const week = describeWeek(store.hours)
    const today = getLocalClock(new Date(), store.timezone).weekday

    return (
        <header className={styles.header}>
            <ThemeImage className={styles.cover} src={store.coverUrl} fallbackStem="capa-padrao" alt="" />

            <div className={styles.card}>
                <div className={styles.identity}>
                    <ThemeImage
                        className={styles.logo}
                        src={store.logoUrl}
                        fallbackStem="logo-padrao-loja"
                        alt={`Logo ${store.name}`}
                    />
                    <div className={styles.details}>
                        <h1 className={styles.name}>{store.name}</h1>
                        {store.address ? (
                            <p className={styles.detail}>
                                <ThemeIcon name="local" size={16} />
                                <span>{store.address}</span>
                            </p>
                        ) : null}
                        {store.minOrderCents > 0 ? (
                            <p className={styles.detail}>
                                <ThemeIcon name="sacola" size={16} />
                                <span>Pedido mínimo {formatCents(store.minOrderCents)}</span>
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className={isOpen ? styles.status : `${styles.status} ${styles.statusClosed}`}>
                    <div className={styles.statusRow}>
                        <span className={styles.statusBadge}>
                            <ThemeIcon name="relogio" size={16} />
                            {isOpen ? 'Aberto agora' : 'Fechado agora'}
                        </span>
                        <button
                            type="button"
                            className={styles.hoursToggle}
                            aria-expanded={showHours}
                            onClick={() => setShowHours((current) => !current)}
                        >
                            {showHours ? 'Esconder horários' : 'Ver horários'}
                        </button>
                    </div>
                    {isOpen ? null : (
                        <p className={styles.closedNote}>Dá para montar a sacola; o envio libera quando a loja abrir.</p>
                    )}
                    {showHours ? (
                        <dl className={styles.week}>
                            {week.map((day) => (
                                <div key={day.weekday} className={day.weekday === today ? styles.today : styles.day}>
                                    <dt>{day.name}</dt>
                                    <dd>{day.ranges.length > 0 ? day.ranges.join(', ') : 'Fechado'}</dd>
                                </div>
                            ))}
                        </dl>
                    ) : null}
                </div>
            </div>
        </header>
    )
}
