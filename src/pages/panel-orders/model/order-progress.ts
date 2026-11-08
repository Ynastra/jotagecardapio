import type { OrderStatus } from '@/entities/order'

export const PROGRESS_MARK_COUNT = 4

const REACHED_MARKS: Record<OrderStatus, number> = {
    received: 1,
    preparing: 2,
    ready: 3,
    completed: 4,
    canceled: 0,
}

// Quantas das 4 marcas de progresso já foram alcançadas; cancelado não avança nenhuma.
export function getReachedMarks(status: OrderStatus): number {
    const reached = REACHED_MARKS[status]
    return reached
}
