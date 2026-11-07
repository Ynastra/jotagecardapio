import { mapStoredLines } from '@/entities/order'
import type { Fulfillment, OrderPaymentStatus, OrderStatus, PaymentMethod } from '@/entities/order'
import { supabase } from '@/shared/api'

import type { OrderTracking, TrackedStore } from '../model/types'

type TrackingRow = {
    store: {
        name: string
        slug: string
        whatsapp: string
        logo_url: string | null
        brand_color: string | null
        theme: string
        timezone: string
        prep_time_minutes: number
        pix_key: string | null
        pix_key_type: TrackedStore['pixKeyType']
    }
    public_code: string
    status: OrderStatus
    payment_status: OrderPaymentStatus
    fulfillment: Fulfillment
    payment_method: PaymentMethod
    created_at: string
    preparing_at: string | null
    ready_at: string | null
    completed_at: string | null
    canceled_at: string | null
    items: unknown
    subtotal_cents: number
    delivery_fee_cents: number
    payment_fee_cents: number
    total_cents: number
}

export class TrackingLoadError extends Error {}

function mapStore(row: TrackingRow['store']): TrackedStore {
    const store = {
        name: row.name,
        slug: row.slug,
        whatsapp: row.whatsapp,
        logoUrl: row.logo_url,
        brandColor: row.brand_color,
        theme: row.theme,
        timezone: row.timezone,
        prepTimeMinutes: row.prep_time_minutes,
        pixKey: row.pix_key,
        pixKeyType: row.pix_key_type,
    }
    return store
}

// null quando o token não corresponde a nenhum pedido.
export async function fetchOrderTracking(token: string): Promise<OrderTracking | null> {
    const { data, error } = await supabase.rpc('get_order_tracking', { token })

    if (error) {
        throw new TrackingLoadError(error.message)
    }
    if (!data) {
        return null
    }

    const row = data as unknown as TrackingRow
    const tracking = {
        store: mapStore(row.store),
        publicCode: row.public_code,
        status: row.status,
        paymentStatus: row.payment_status,
        fulfillment: row.fulfillment,
        paymentMethod: row.payment_method,
        createdAt: row.created_at,
        preparingAt: row.preparing_at,
        readyAt: row.ready_at,
        completedAt: row.completed_at,
        canceledAt: row.canceled_at,
        items: mapStoredLines(row.items),
        subtotalCents: row.subtotal_cents,
        deliveryFeeCents: row.delivery_fee_cents,
        paymentFeeCents: row.payment_fee_cents,
        totalCents: row.total_cents,
    }
    return tracking
}
