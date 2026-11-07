import type { PanelOrder } from '@/entities/order'

export function buildPanelOrder(overrides: Partial<PanelOrder> = {}): PanelOrder {
    const order: PanelOrder = {
        id: 'o1',
        number: 7,
        publicCode: '007-490361',
        trackingToken: 'token',
        items: [],
        address: null,
        subtotalCents: 3000,
        deliveryFeeCents: 0,
        paymentFeeCents: 0,
        totalCents: 3000,
        changeForCents: null,
        createdAt: '2026-11-07T12:00:00Z',
        customerName: 'Maria da Silva',
        customerPhone: '11999998888',
        fulfillment: 'delivery',
        paymentMethod: 'pix',
        notes: null,
        status: 'received',
        paymentStatus: 'pending',
        preparingAt: null,
        readyAt: null,
        completedAt: null,
        canceledAt: null,
        ...overrides,
    }
    return order
}
