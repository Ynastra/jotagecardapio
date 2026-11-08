import { useState, type KeyboardEvent } from 'react'

import { formatPriceText, INVALID_PRICE_MESSAGE, parsePriceText } from '../model/addon-form'
import styles from './addons.module.css'

type InlinePriceFieldProps = {
    label: string
    priceCents: number
    onCommit: (priceCents: number) => Promise<boolean>
}

// Grava ao sair do campo ou com Enter; Esc devolve o valor salvo.
export function InlinePriceField({ label, priceCents, onCommit }: InlinePriceFieldProps) {
    const [draft, setDraft] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const text = draft ?? formatPriceText(priceCents)

    function discard() {
        setDraft(null)
        setError(null)
    }

    async function commit() {
        if (draft === null) {
            return
        }

        const parsed = parsePriceText(draft)
        if (parsed === null) {
            setError(INVALID_PRICE_MESSAGE)
            return
        }

        if (parsed === priceCents) {
            discard()
            return
        }

        const saved = await onCommit(parsed)
        if (saved) {
            discard()
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            event.currentTarget.blur()
        } else if (event.key === 'Escape') {
            discard()
        }
    }

    return (
        <div className={styles.priceBox}>
            <input
                className={styles.priceInput}
                inputMode="decimal"
                aria-label={label}
                aria-invalid={error !== null}
                value={text}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={handleKeyDown}
            />
            {error ? <span className={styles.fieldError}>{error}</span> : null}
        </div>
    )
}
