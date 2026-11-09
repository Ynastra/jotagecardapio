import type { PanelOrder } from '@/entities/order'

export const SAMPLE_ORDER_ID = 'pedido-de-teste'

export function buildSampleOrder(now: Date): PanelOrder {
    const createdAt = now.toISOString()

    return {
        id: SAMPLE_ORDER_ID,
        number: 0,
        publicCode: '000-TESTE',
        trackingToken: 'teste',
        items: [
            {
                productId: 'item-teste-1',
                name: 'X-Burguer',
                quantity: 2,
                unitPriceCents: 2200,
                totalCents: 4400,
                notes: 'Sem cebola',
                options: [
                    {
                        optionId: 'opcao-teste-1',
                        groupTitle: 'Ponto da carne',
                        name: 'Ao ponto',
                        quantity: 1,
                        unitPriceCents: 0,
                    },
                    {
                        optionId: 'opcao-teste-2',
                        groupTitle: 'Adicionais',
                        name: 'Bacon',
                        quantity: 1,
                        unitPriceCents: 0,
                    },
                ],
            },
            {
                productId: 'item-teste-2',
                name: 'Refrigerante lata',
                quantity: 1,
                unitPriceCents: 600,
                totalCents: 600,
                notes: null,
                options: [],
            },
        ],
        address: {
            cep: '01001000',
            city: 'São Paulo',
            state: 'SP',
            street: 'Rua de Exemplo',
            number: '100',
            neighborhood: 'Centro',
            complement: 'Apto 12',
            reference: 'Portão azul',
        },
        subtotalCents: 5000,
        deliveryFeeCents: 500,
        paymentFeeCents: 0,
        totalCents: 5500,
        changeForCents: 10000,
        createdAt,
        customerName: 'Cliente de Teste',
        customerPhone: '11999999999',
        fulfillment: 'delivery',
        paymentMethod: 'cash',
        notes: 'Pedido de teste da impressão',
        status: 'received',
        paymentStatus: 'pending',
        preparingAt: null,
        readyAt: null,
        completedAt: null,
        canceledAt: null,
    }
}
