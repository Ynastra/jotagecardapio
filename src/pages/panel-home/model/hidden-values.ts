import { useState } from 'react'

import { formatCents, readStoredJson, writeStoredJson } from '@/shared/lib'

const HIDDEN_VALUES_STORAGE_KEY = 'jgcardapio:painel-inicio:valores-ocultos'

export const HIDDEN_MONEY_MASK = 'R$ •••'

export function formatMaskedCents(cents: number, isHidden: boolean): string {
    if (isHidden) {
        return HIDDEN_MONEY_MASK
    }

    const formatted = formatCents(cents)
    return formatted
}

export function useHiddenValues() {
    const [isHidden, setHidden] = useState(() => readStoredJson<boolean>(HIDDEN_VALUES_STORAGE_KEY, false))

    function toggle() {
        const next = !isHidden
        writeStoredJson(HIDDEN_VALUES_STORAGE_KEY, next)
        setHidden(next)
    }

    function formatMoney(cents: number): string {
        const text = formatMaskedCents(cents, isHidden)
        return text
    }

    return { isHidden, toggle, formatMoney }
}
