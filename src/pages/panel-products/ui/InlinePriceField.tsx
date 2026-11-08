import { useState, type KeyboardEvent } from 'react'

import { formatPriceText } from '../model/price-edit'
import styles from './products.module.css'

type InlinePriceFieldProps = {
    label: string
    priceCents: number | null
    autoFocus?: boolean
    // Devolve a mensagem de erro do campo, ou null quando gravou ou nada mudou.
    onCommit: (text: string) => Promise<string | null>
    onDismiss?: () => void
}

// Grava ao sair do campo ou com Enter; Esc devolve o valor salvo.
export function InlinePriceField({ label, priceCents, autoFocus = false, onCommit, onDismiss }: InlinePriceFieldProps) {
    const [draft, setDraft] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const text = draft ?? (priceCents === null ? '' : formatPriceText(priceCents))

    function discard() {
        setDraft(null)
        setError(null)
        onDismiss?.()
    }

    async function commit() {
        if (draft === null) {
            onDismiss?.()
            return
        }

        const failure = await onCommit(draft)
        if (failure === null) {
            discard()
        } else {
            setError(failure)
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
                autoFocus={autoFocus}
                value={text}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={handleKeyDown}
            />
            {error ? <span className={styles.fieldError}>{error}</span> : null}
        </div>
    )
}
