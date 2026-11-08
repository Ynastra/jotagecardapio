import {
    mapStoredAddress,
    mapStoredLines,
    type OrderPaymentStatus,
    type OrderStatus,
    type PanelOrder,
} from '@/entities/order'
import { supabase } from '@/shared/api'

const ORDER_COLUMNS =
    'id, number, public_code, tracking_token, payment_status, preparing_at, ready_at, completed_at, canceled_at, customer_name, customer_phone, fulfillment, address, payment_method, change_for_cents, notes, items, subtotal_cents, delivery_fee_cents, payment_fee_cents, total_cents, status, created_at'

type OrderRow = {
    id: string
    number: number
    public_code: string
    tracking_token: string
    payment_status: 'pending' | 'paid'
    preparing_at: string | null
    ready_at: string | null
    completed_at: string | null
    canceled_at: string | null
    customer_name: string
    customer_phone: string
    fulfillment: PanelOrder['fulfillment']
    address: unknown
    payment_method: PanelOrder['paymentMethod']
    change_for_cents: number | null
    notes: string | null
    items: unknown
    subtotal_cents: number
    delivery_fee_cents: number
    payment_fee_cents: number
    total_cents: number
    status: OrderStatus
    created_at: string
}

function mapOrder(row: OrderRow): PanelOrder {
    const order = {
        id: row.id,
        number: row.number,
        publicCode: row.public_code,
        trackingToken: row.tracking_token,
        paymentStatus: row.payment_status,
        preparingAt: row.preparing_at,
        readyAt: row.ready_at,
        completedAt: row.completed_at,
        canceledAt: row.canceled_at,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        fulfillment: row.fulfillment,
        address: mapStoredAddress(row.address),
        paymentMethod: row.payment_method,
        changeForCents: row.change_for_cents,
        notes: row.notes,
        items: mapStoredLines(row.items),
        subtotalCents: row.subtotal_cents,
        deliveryFeeCents: row.delivery_fee_cents,
        paymentFeeCents: row.payment_fee_cents,
        totalCents: row.total_cents,
        status: row.status,
        createdAt: row.created_at,
    }
    return order
}

export type OrdersQuery = {
    storeId: string
    since: Date
    limit: number
}

export async function fetchOrders({ storeId, since, limit }: OrdersQuery): Promise<PanelOrder[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('store_id', storeId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        throw error
    }

    const orders = (data as OrderRow[]).map(mapOrder)
    return orders
}

function firstMappedOrder(data: unknown): PanelOrder | null {
    const rows = (data ?? []) as OrderRow[]
    const order = rows.length > 0 ? mapOrder(rows[0]) : null
    return order
}

// Grava só se o status no banco ainda for o que a tela mostrava; sem linha
// de volta, o pedido mudou em outro aparelho.
export async function saveOrderStatus(
    orderId: string,
    expectedStatus: OrderStatus,
    nextStatus: OrderStatus,
): Promise<PanelOrder | null> {
    const { data, error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)
        .eq('status', expectedStatus)
        .select(ORDER_COLUMNS)

    if (error) {
        throw error
    }

    const order = firstMappedOrder(data)
    return order
}

export async function savePaymentStatus(
    orderId: string,
    expectedStatus: OrderPaymentStatus,
    nextStatus: OrderPaymentStatus,
): Promise<PanelOrder | null> {
    const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: nextStatus })
        .eq('id', orderId)
        .eq('payment_status', expectedStatus)
        .select(ORDER_COLUMNS)

    if (error) {
        throw error
    }

    const order = firstMappedOrder(data)
    return order
}

export async function fetchOrderById(orderId: string): Promise<PanelOrder | null> {
    const { data, error } = await supabase.from('orders').select(ORDER_COLUMNS).eq('id', orderId)

    if (error) {
        throw error
    }

    const order = firstMappedOrder(data)
    return order
}

export async function countCustomerOrders(storeId: string, customerPhone: string): Promise<number> {
    const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('customer_phone', customerPhone)

    if (error) {
        throw error
    }

    const total = count ?? 0
    return total
}

// Avisa a cada pedido novo ou mudança de status; devolve a função que encerra.
export function subscribeToOrders(storeId: string, onChange: (order: PanelOrder, isNew: boolean) => void): () => void {
    const channel = supabase
        .channel(`pedidos-${storeId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` },
            (payload) => {
                if (payload.eventType === 'DELETE') {
                    return
                }
                onChange(mapOrder(payload.new as OrderRow), payload.eventType === 'INSERT')
            },
        )
        .subscribe()

    const unsubscribe = () => {
        supabase.removeChannel(channel)
    }
    return unsubscribe
}
