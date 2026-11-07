import type { OrderAddress, OrderLine, OrderLineOption } from './types'

// Formato gravado pela função place_order no jsonb do pedido.
type StoredLineOption = {
    option_id: string
    group_title: string
    name: string
    quantity: number
    unit_price_cents: number
}

type StoredLine = {
    product_id: string
    name: string
    quantity: number
    unit_price_cents: number
    total_cents: number
    notes: string | null
    options: StoredLineOption[]
}

function mapLineOption(stored: StoredLineOption): OrderLineOption {
    const option = {
        optionId: stored.option_id,
        groupTitle: stored.group_title,
        name: stored.name,
        quantity: stored.quantity,
        unitPriceCents: stored.unit_price_cents,
    }
    return option
}

export function mapStoredLines(stored: unknown): OrderLine[] {
    const lines = (stored as StoredLine[]).map((line) => ({
        productId: line.product_id,
        name: line.name,
        quantity: line.quantity,
        unitPriceCents: line.unit_price_cents,
        totalCents: line.total_cents,
        notes: line.notes,
        options: line.options.map(mapLineOption),
    }))
    return lines
}

export function mapStoredAddress(stored: unknown): OrderAddress | null {
    const address = stored ? (stored as OrderAddress) : null
    return address
}
