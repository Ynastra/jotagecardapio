import type { DraftLine } from '@/entities/order'

export type CartAction =
    | { type: 'add'; line: DraftLine }
    | { type: 'setQuantity'; key: string; quantity: number }
    | { type: 'clear' }

// Dois itens com o mesmo produto, opcionais e observação viram uma linha só.
function buildLineSignature(line: DraftLine): string {
    const options = line.options.map((option) => `${option.optionId}:${option.quantity}`).sort()
    const signature = [line.productId, ...options, line.notes.trim()].join('|')
    return signature
}

function addLine(lines: DraftLine[], incoming: DraftLine): DraftLine[] {
    const incomingSignature = buildLineSignature(incoming)
    const existing = lines.find((line) => buildLineSignature(line) === incomingSignature)

    if (!existing) {
        const appended = [...lines, incoming]
        return appended
    }

    const merged = lines.map((line) =>
        line.key === existing.key ? { ...line, quantity: line.quantity + incoming.quantity } : line,
    )
    return merged
}

function setLineQuantity(lines: DraftLine[], key: string, quantity: number): DraftLine[] {
    if (quantity <= 0) {
        const remaining = lines.filter((line) => line.key !== key)
        return remaining
    }

    const updated = lines.map((line) => (line.key === key ? { ...line, quantity } : line))
    return updated
}

export function cartReducer(lines: DraftLine[], action: CartAction): DraftLine[] {
    switch (action.type) {
        case 'add': {
            const added = addLine(lines, action.line)
            return added
        }
        case 'setQuantity': {
            const updated = setLineQuantity(lines, action.key, action.quantity)
            return updated
        }
        case 'clear': {
            const empty: DraftLine[] = []
            return empty
        }
    }
}

export function getSubtotalCents(lines: readonly DraftLine[]): number {
    const subtotal = lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0)
    return subtotal
}

export function countItems(lines: readonly DraftLine[]): number {
    const count = lines.reduce((total, line) => total + line.quantity, 0)
    return count
}

export function keepAvailableLines(lines: readonly DraftLine[], availableProductIds: ReadonlySet<string>): DraftLine[] {
    const available = lines.filter((line) => availableProductIds.has(line.productId))
    return available
}
