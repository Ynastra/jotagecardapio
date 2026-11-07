import { mapStoredAddress, mapStoredLines, type OrderStatus, type PanelOrder } from '@/entities/order'
import { supabase } from '@/shared/api'

const RECENT_ORDERS_LIMIT = 60
const ORDER_COLUMNS =
    'id, number, customer_name, customer_phone, fulfillment, address, payment_method, change_for_cents, notes, items, subtotal_cents, delivery_fee_cents, total_cents, status, created_at'

export type PanelStore = {
    id: string
    name: string
    slug: string
}

type OrderRow = {
    id: string
    number: number
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
    total_cents: number
    status: OrderStatus
    created_at: string
}

function mapOrder(row: OrderRow): PanelOrder {
    const order = {
        id: row.id,
        number: row.number,
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
        totalCents: row.total_cents,
        status: row.status,
        createdAt: row.created_at,
    }
    return order
}

export async function fetchMyStores(): Promise<PanelStore[]> {
    const { data, error } = await supabase.from('store_members').select('stores (id, name, slug)')

    if (error) {
        throw error
    }

    const rows = (data ?? []) as unknown as { stores: PanelStore | null }[]
    const stores = rows.map((row) => row.stores).filter((store): store is PanelStore => store !== null)
    return stores
}

export async function fetchRecentOrders(storeId: string): Promise<PanelOrder[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(ORDER_COLUMNS)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(RECENT_ORDERS_LIMIT)

    if (error) {
        throw error
    }

    const orders = (data as OrderRow[]).map(mapOrder)
    return orders
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)

    if (error) {
        throw error
    }
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
