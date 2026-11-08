import type { ReactNode } from 'react'

import styles from './order-board.module.css'

export type ColumnTone = 'received' | 'preparing' | 'ready' | 'finished'

type BoardColumnProps = {
    columnId: string
    title: string
    tone: ColumnTone
    count: number
    totalLabel?: string
    children: ReactNode
}

export function BoardColumn({ columnId, title, tone, count, totalLabel, children }: BoardColumnProps) {
    return (
        <section id={columnId} className={`${styles.column} ${styles[tone]}`} aria-labelledby={`${columnId}-title`}>
            <header className={styles.columnHeader}>
                <h2 id={`${columnId}-title`} className={styles.columnTitle}>
                    {title}
                </h2>
                {totalLabel ? <span className={styles.columnTotal}>{totalLabel}</span> : null}
                <span className={styles.columnCount}>{count}</span>
            </header>
            {count === 0 ? <p className={styles.empty}>Nenhum pedido</p> : children}
        </section>
    )
}
