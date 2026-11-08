import type { PanelOrder } from '@/entities/order'

export const ORDER_CONFLICT_MESSAGE = 'Este pedido mudou em outro aparelho. Confira o status atual.'

export type OrderWriteResolution =
    | { kind: 'saved'; order: PanelOrder }
    | { kind: 'conflict'; message: string }

// A gravação condicional devolve a linha gravada; sem linha, outro aparelho
// mudou o pedido antes e a tela precisa reler o estado atual.
export function resolveOrderWrite(saved: PanelOrder | null): OrderWriteResolution {
    if (saved) {
        const resolution: OrderWriteResolution = { kind: 'saved', order: saved }
        return resolution
    }

    const conflict: OrderWriteResolution = { kind: 'conflict', message: ORDER_CONFLICT_MESSAGE }
    return conflict
}
