import type { Fulfillment, OrderStatus } from '@/entities/order'

import type { OrderTracking } from './types'

export type TimelineStepState = 'done' | 'current' | 'upcoming'

export type TimelineStep = {
    key: 'received' | 'preparing' | 'ready' | 'completed'
    label: string
    // Horário em que a etapa começou; null enquanto ela não aconteceu.
    at: string | null
    state: TimelineStepState
}

const STEP_ORDER: readonly TimelineStep['key'][] = ['received', 'preparing', 'ready', 'completed']

const READY_LABELS: Record<Fulfillment, string> = {
    delivery: 'Saiu para entrega',
    pickup: 'Pronto para retirada',
}

function getStepLabel(key: TimelineStep['key'], fulfillment: Fulfillment): string {
    const labels: Record<TimelineStep['key'], string> = {
        received: 'Recebido',
        preparing: 'Em preparo',
        ready: READY_LABELS[fulfillment],
        completed: 'Concluído',
    }
    return labels[key]
}

function getStepTime(tracking: OrderTracking, key: TimelineStep['key']): string | null {
    const times: Record<TimelineStep['key'], string | null> = {
        received: tracking.createdAt,
        preparing: tracking.preparingAt,
        ready: tracking.readyAt,
        completed: tracking.completedAt,
    }
    return times[key]
}

function getReachedIndex(status: OrderStatus, tracking: OrderTracking): number {
    if (status !== 'canceled') {
        const index = STEP_ORDER.indexOf(status)
        return index
    }

    // Pedido cancelado mantém só as etapas que chegaram a acontecer.
    const reachedKeys = STEP_ORDER.filter((key) => getStepTime(tracking, key) !== null)
    const lastReached = reachedKeys.length - 1
    return lastReached
}

export function buildTimeline(tracking: OrderTracking): TimelineStep[] {
    const reachedIndex = getReachedIndex(tracking.status, tracking)
    const isCanceled = tracking.status === 'canceled'

    const steps = STEP_ORDER.map((key, index) => {
        const isReached = index <= reachedIndex
        const isCurrent = index === reachedIndex && !isCanceled
        const state: TimelineStepState = isCurrent ? 'current' : isReached ? 'done' : 'upcoming'

        const step = {
            key,
            label: getStepLabel(key, tracking.fulfillment),
            at: isReached ? getStepTime(tracking, key) : null,
            state,
        }
        return step
    })
    return steps
}
