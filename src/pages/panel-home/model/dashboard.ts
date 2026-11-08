const MARKETPLACE_FEE_RATE = 0.25
const PERCENT = 100

export type TopProduct = {
    productId: string | null
    name: string
    imageUrl: string | null
    priceCents: number | null
    quantity: number
    revenueCents: number
}

export type MonthlyRevenue = {
    month: string
    revenueCents: number
}

export type Dashboard = {
    revenueCents: number
    ordersCount: number
    customersCount: number
    deliveryCount: number
    pickupCount: number
    canceledCount: number
    itemsTotal: number
    topProducts: TopProduct[]
    monthlyRevenue: MonthlyRevenue[]
    inProgressCount: number
}

type DashboardPayload = {
    revenue_cents: number
    orders_count: number
    customers_count: number
    delivery_count: number
    pickup_count: number
    canceled_count: number
    items_total: number
    top_products: {
        product_id: string | null
        name: string
        image_url: string | null
        price_cents: number | null
        quantity: number
        revenue_cents: number
    }[]
    monthly_revenue: { month: string; revenue_cents: number }[]
    in_progress_count: number
}

export function parseDashboard(payload: DashboardPayload): Dashboard {
    const dashboard = {
        revenueCents: payload.revenue_cents,
        ordersCount: payload.orders_count,
        customersCount: payload.customers_count,
        deliveryCount: payload.delivery_count,
        pickupCount: payload.pickup_count,
        canceledCount: payload.canceled_count,
        itemsTotal: payload.items_total,
        topProducts: payload.top_products.map((product) => ({
            productId: product.product_id,
            name: product.name,
            imageUrl: product.image_url,
            priceCents: product.price_cents,
            quantity: product.quantity,
            revenueCents: product.revenue_cents,
        })),
        monthlyRevenue: payload.monthly_revenue.map((entry) => ({
            month: entry.month,
            revenueCents: entry.revenue_cents,
        })),
        inProgressCount: payload.in_progress_count,
    }
    return dashboard
}

// Sem pedido no período não há ticket: a tela mostra um traço.
export function averageTicketCents(revenueCents: number, ordersCount: number): number | null {
    if (ordersCount === 0) {
        return null
    }

    const ticket = Math.round(revenueCents / ordersCount)
    return ticket
}

export function percentOf(part: number, total: number): number {
    if (total === 0) {
        return 0
    }

    const percent = Math.round((part / total) * PERCENT)
    return percent
}

// O que um marketplace cobraria de comissão sobre o mesmo faturamento.
export function marketplaceFeeSavingsCents(revenueCents: number): number {
    const savings = Math.round(revenueCents * MARKETPLACE_FEE_RATE)
    return savings
}
