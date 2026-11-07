export type Fulfillment = 'delivery' | 'pickup'

export type PaymentMethod = 'pix' | 'cash' | 'credit' | 'debit'

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'canceled'

// Item ainda na sacola: o preço é a estimativa do navegador; o valor que vale
// é o que o banco recalcula ao gravar o pedido.
export type DraftLineOption = {
    optionId: string
    name: string
    quantity: number
    priceCents: number
}

export type DraftLine = {
    key: string
    productId: string
    name: string
    quantity: number
    unitPriceCents: number
    notes: string
    options: DraftLineOption[]
}

export type OrderLineOption = {
    optionId: string
    groupTitle: string
    name: string
    quantity: number
    unitPriceCents: number
}

export type OrderLine = {
    productId: string
    name: string
    quantity: number
    unitPriceCents: number
    totalCents: number
    notes: string | null
    options: OrderLineOption[]
}

export type OrderAddress = {
    street: string
    number: string
    neighborhood: string
    complement: string
    reference: string
}

export type PlacedOrder = {
    id: string
    number: number
    items: OrderLine[]
    address: OrderAddress | null
    subtotalCents: number
    deliveryFeeCents: number
    totalCents: number
    changeForCents: number | null
    createdAt: string
}

export type PanelOrder = PlacedOrder & {
    customerName: string
    customerPhone: string
    fulfillment: Fulfillment
    paymentMethod: PaymentMethod
    notes: string | null
    status: OrderStatus
}
