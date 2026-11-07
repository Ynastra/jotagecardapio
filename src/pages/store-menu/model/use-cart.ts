import { useCallback, useEffect, useMemo, useReducer } from 'react'

import type { DraftLine } from '@/entities/order'
import { readStoredJson, writeStoredJson } from '@/shared/lib'

import { cartReducer, countItems, getSubtotalCents, keepAvailableLines } from './cart'

const CART_KEY_PREFIX = 'jgcardapio:sacola:'

// A sacola fica guardada por loja, para quem fecha a aba sem querer não perder
// o que já tinha escolhido. Itens que saíram do cardápio somem ao reabrir.
export function useCart(storeSlug: string, availableProductIds: ReadonlySet<string>) {
    const storageKey = `${CART_KEY_PREFIX}${storeSlug}`
    const [lines, dispatch] = useReducer(cartReducer, undefined, () =>
        keepAvailableLines(readStoredJson<DraftLine[]>(storageKey, []), availableProductIds),
    )

    useEffect(() => {
        writeStoredJson(storageKey, lines)
    }, [storageKey, lines])

    const add = useCallback((line: DraftLine) => dispatch({ type: 'add', line }), [])
    const setQuantity = useCallback((key: string, quantity: number) => dispatch({ type: 'setQuantity', key, quantity }), [])
    const clear = useCallback(() => dispatch({ type: 'clear' }), [])

    const cart = useMemo(
        () => ({
            lines,
            add,
            setQuantity,
            clear,
            subtotalCents: getSubtotalCents(lines),
            itemCount: countItems(lines),
        }),
        [lines, add, setQuantity, clear],
    )
    return cart
}
