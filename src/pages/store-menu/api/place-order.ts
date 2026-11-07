import { mapStoredAddress, mapStoredLines, type PlacedOrder } from '@/entities/order'
import { supabase } from '@/shared/api'

import type { PlaceOrderPayload } from '../model/checkout'

type PlacedOrderRow = {
    id: string
    number: number
    items: unknown
    address: unknown
    subtotal_cents: number
    delivery_fee_cents: number
    total_cents: number
    change_for_cents: number | null
    created_at: string
}

// code é o motivo devolvido pela função do banco (ex.: store_closed), ou
// network_error quando a requisição nem chegou lá.
export class PlaceOrderError extends Error {
    constructor(readonly code: string) {
        super(code)
    }
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<PlacedOrder> {
    const { data, error } = await supabase.rpc('place_order', { payload })

    if (error) {
        throw new PlaceOrderError(error.message || 'network_error')
    }

    const row = data as PlacedOrderRow
    const order = {
        id: row.id,
        number: row.number,
        items: mapStoredLines(row.items),
        address: mapStoredAddress(row.address),
        subtotalCents: row.subtotal_cents,
        deliveryFeeCents: row.delivery_fee_cents,
        totalCents: row.total_cents,
        changeForCents: row.change_for_cents,
        createdAt: row.created_at,
    }
    return order
}
