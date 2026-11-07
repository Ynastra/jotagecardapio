import { formatCents } from '@/shared/lib'
import { ThemeIcon } from '@/shared/ui'

import styles from './cart-bar.module.css'

type CartBarProps = {
    itemCount: number
    subtotalCents: number
    onOpen: () => void
}

export function CartBar({ itemCount, subtotalCents, onOpen }: CartBarProps) {
    const itemsLabel = itemCount === 1 ? '1 item' : `${itemCount} itens`

    return (
        <div className={styles.bar}>
            <button type="button" className={styles.button} onClick={onOpen}>
                <span className={styles.count}>
                    <ThemeIcon name="sacola" size={20} />
                    {itemsLabel}
                </span>
                <span>Ver sacola</span>
                <span>{formatCents(subtotalCents)}</span>
            </button>
        </div>
    )
}
