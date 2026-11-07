import type { DraftLine } from '@/entities/order'
import { formatCents } from '@/shared/lib'
import { QuantityStepper } from '@/shared/ui'

import styles from './checkout-sheet.module.css'

type CartLinesProps = {
    lines: readonly DraftLine[]
    onSetQuantity: (key: string, quantity: number) => void
}

function describeOptions(line: DraftLine): string {
    const description = line.options
        .map((option) => (option.quantity > 1 ? `${option.quantity}x ${option.name}` : option.name))
        .join(', ')
    return description
}

export function CartLines({ lines, onSetQuantity }: CartLinesProps) {
    return (
        <ul className={styles.lines}>
            {lines.map((line) => (
                <li key={line.key} className={styles.line}>
                    <div className={styles.lineInfo}>
                        <span className={styles.lineName}>{line.name}</span>
                        {line.options.length > 0 ? <span className={styles.lineDetail}>{describeOptions(line)}</span> : null}
                        {line.notes ? <span className={styles.lineDetail}>Obs.: {line.notes}</span> : null}
                        <strong>{formatCents(line.unitPriceCents * line.quantity)}</strong>
                    </div>
                    <QuantityStepper
                        compact
                        label={line.name}
                        value={line.quantity}
                        onChange={(quantity) => onSetQuantity(line.key, quantity)}
                    />
                </li>
            ))}
        </ul>
    )
}
