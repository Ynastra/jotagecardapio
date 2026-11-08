import { useState } from 'react'

import { formatCents } from '@/shared/lib'
import { ThemeIcon, ThemeImage } from '@/shared/ui'

import { describeStoreStatus, describeWeek, getLocalClock } from '../model/opening-hours'
import { describeStoreAddress } from '../model/store-address'
import type { Store } from '../model/types'
import styles from './store-header.module.css'

type StoreHeaderProps = {
    store: Store
    itemCount: number
    onOpenCart: () => void
}

function describeDeliveryFact(store: Store): string | null {
    if (!store.acceptsDelivery) {
        return null
    }

    if (store.deliveryMode === 'neighborhood') {
        return 'Entrega por bairro'
    }

    const fact = store.deliveryFeeCents > 0 ? `Entrega ${formatCents(store.deliveryFeeCents)}` : 'Entrega grátis'
    return fact
}

function describeLocality(store: Store): string | null {
    if (store.addressDisplay === 'hidden') {
        return null
    }

    const cityName = store.city?.trim() ?? ''
    const stateCode = store.state?.trim() ?? ''
    const parts = [cityName, stateCode].filter((part) => part !== '')
    const locality = parts.length > 0 ? parts.join(', ') : null
    return locality
}

function describeItemCount(itemCount: number): string {
    const description = itemCount === 1 ? '1 item' : `${itemCount} itens`
    return description
}

export function StoreHeader({ store, itemCount, onOpenCart }: StoreHeaderProps) {
    const [showDetails, setShowDetails] = useState(false)
    const clock = getLocalClock(new Date(), store.timezone)
    const status = describeStoreStatus(store.hours, store.enforceOpeningHours, clock)
    const week = describeWeek(store.hours)
    const addressText = describeStoreAddress(store)
    const deliveryFact = describeDeliveryFact(store)
    const locality = describeLocality(store)
    const hasMinOrder = store.minOrderCents > 0

    return (
        <header className={styles.header}>
            <div className={styles.top}>
                <ThemeImage
                    className={styles.logo}
                    src={store.logoUrl}
                    fallbackStem="logo-padrao-loja"
                    alt={`Logo ${store.name}`}
                />

                <div className={styles.identity}>
                    <h1 className={styles.name}>{store.name}</h1>
                    {locality ? <p className={styles.subtitle}>{locality}</p> : null}
                </div>

                <button type="button" className={styles.bag} aria-label={`Abrir sacola, ${describeItemCount(itemCount)}`} onClick={onOpenCart}>
                    <ThemeIcon name="sacola" size={19} />
                    <span aria-hidden="true">{itemCount}</span>
                </button>
            </div>

            <ul className={styles.service}>
                <li className={status.isOpen ? styles.status : `${styles.status} ${styles.statusClosed}`}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {status.label}
                </li>
                {deliveryFact ? (
                    <li className={styles.serviceItem}>
                        <ThemeIcon name="entrega" size={16} />
                        {deliveryFact}
                    </li>
                ) : null}
                {hasMinOrder ? (
                    <li className={styles.serviceItem}>
                        <ThemeIcon name="sacola" size={16} />
                        Pedido mínimo {formatCents(store.minOrderCents)}
                    </li>
                ) : null}
                {store.acceptsPickup ? (
                    <li className={styles.serviceItem}>
                        <ThemeIcon name="retirada" size={16} />
                        Retirada no local
                    </li>
                ) : null}
                <li>
                    <button
                        type="button"
                        className={styles.detailsToggle}
                        aria-expanded={showDetails}
                        onClick={() => setShowDetails((current) => !current)}
                    >
                        Horários e endereço
                        <span
                            className={showDetails ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}
                            aria-hidden="true"
                        />
                    </button>
                </li>
            </ul>

            {status.isOpen ? null : (
                <p className={styles.closedNote}>Dá para montar a sacola; o envio libera quando a loja abrir.</p>
            )}

            {showDetails ? (
                <div className={styles.details}>
                    {addressText ? (
                        <p className={styles.address}>
                            <ThemeIcon name="local" size={16} />
                            <span>{addressText}</span>
                        </p>
                    ) : null}
                    <dl className={styles.week}>
                        {week.map((day) => (
                            <div key={day.weekday} className={day.weekday === clock.weekday ? styles.today : styles.day}>
                                <dt>{day.name}</dt>
                                <dd>{day.ranges.length > 0 ? day.ranges.join(', ') : 'Fechado'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ) : null}
        </header>
    )
}
