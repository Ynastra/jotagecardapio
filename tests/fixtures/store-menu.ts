import type { PlacedOrder } from '@/entities/order'
import type { Store } from '@/pages/store-menu/model/types'

export function createStore(overrides: Partial<Store> = {}): Store {
    const store: Store = {
        id: 'loja',
        slug: 'zedoburguerlucelia',
        name: 'Zé do Burguer',
        address: null,
        whatsapp: '5518996649346',
        logoUrl: null,
        coverUrl: null,
        theme: 'base',
        brandColor: '#060504',
        minOrderCents: 700,
        deliveryFeeCents: 500,
        acceptsDelivery: true,
        acceptsPickup: true,
        enforceOpeningHours: true,
        timezone: 'America/Sao_Paulo',
        prepTimeMinutes: 40,
        city: 'Lucélia',
        state: 'SP',
        addressDisplay: 'full',
        requireCep: false,
        orderCopyWhatsapp: true,
        hideUnavailableItems: true,
        cartNoticeTitle: null,
        cartNoticeBody: null,
        pixKey: null,
        pixKeyType: null,
        hours: [],
        deliveryZones: [],
        freeDeliveryAboveCents: null,
        paymentMethods: [
            { method: 'pix', enabledDelivery: true, enabledPickup: true, feeKind: 'fixed', feePercent: 0, feeFixedCents: 0 },
            { method: 'cash', enabledDelivery: true, enabledPickup: true, feeKind: 'fixed', feePercent: 0, feeFixedCents: 0 },
        ],
        ...overrides,
    }
    return store
}

export function createPlacedOrder(overrides: Partial<PlacedOrder> = {}): PlacedOrder {
    const order: PlacedOrder = {
        id: 'pedido',
        number: 7,
        publicCode: '007-490361',
        trackingToken: 'token',
        items: [],
        address: null,
        subtotalCents: 4500,
        deliveryFeeCents: 0,
        paymentFeeCents: 0,
        totalCents: 4500,
        changeForCents: null,
        createdAt: '2026-11-07T22:00:00Z',
        ...overrides,
    }
    return order
}
