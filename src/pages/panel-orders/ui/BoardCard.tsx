import {
    formatClockTime,
    getStatusLabel,
    PAYMENT_LABELS,
    type OrderAddress,
    type OrderStatus,
    type PanelOrder,
} from '@/entities/order'
import { formatBrazilianPhone, formatCents } from '@/shared/lib'
import { Button } from '@/shared/ui'

import { describeOrderMoment } from '../model/order-moment'
import { getNextStep } from '../model/order-flow'
import { getReachedMarks, PROGRESS_MARK_COUNT } from '../model/order-progress'
import styles from './board-card.module.css'

const STATUS_CLASSES: Record<OrderStatus, string> = {
    received: styles.received,
    preparing: styles.preparing,
    ready: styles.ready,
    completed: styles.completed,
    canceled: styles.canceled,
}

type BoardCardProps = {
    order: PanelOrder
    timeZone: string
    isFresh: boolean
    isPending: boolean
    notifyUrl: string | null
    onChangeStatus: (orderId: string, status: OrderStatus) => void
    onOpen: (orderId: string) => void
}

function summarizeAddress(address: OrderAddress): string {
    const parts = [`${address.street}, ${address.number}`, address.neighborhood]
    const summary = parts.filter(Boolean).join(' · ')
    return summary
}

export function BoardCard({ order, timeZone, isFresh, isPending, notifyUrl, onChangeStatus, onOpen }: BoardCardProps) {
    const nextStep = getNextStep(order.status, order.fulfillment)
    const reachedMarks = getReachedMarks(order.status)
    const classes = [styles.card, STATUS_CLASSES[order.status], isFresh ? styles.fresh : ''].filter(Boolean).join(' ')
    const paymentStatusClass = order.paymentStatus === 'paid' ? styles.paid : styles.pending
    const paymentStatusLabel = order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'
    const finishedAt = order.completedAt ? formatClockTime(order.completedAt, timeZone) : null

    return (
        <article className={classes} onClick={() => onOpen(order.id)}>
            <header className={styles.header}>
                <h3 className={styles.code}>{order.publicCode}</h3>
                <time className={styles.time} dateTime={order.createdAt}>
                    {describeOrderMoment(order.createdAt, new Date(), timeZone)}
                </time>
            </header>

            {order.status === 'canceled' ? (
                <span className={styles.canceledBadge}>Cancelado</span>
            ) : (
                <span className={styles.statusLabel}>{getStatusLabel(order.status, order.fulfillment)}</span>
            )}

            <div className={styles.customer}>
                <strong>{order.customerName}</strong>
                <span className={styles.phone}>{formatBrazilianPhone(order.customerPhone)}</span>
            </div>
            {order.fulfillment === 'delivery' && order.address ? (
                <p className={styles.address}>{summarizeAddress(order.address)}</p>
            ) : null}

            <p className={styles.payment}>
                <span>{PAYMENT_LABELS[order.paymentMethod]}</span>
                <span className={`${styles.paymentStatus} ${paymentStatusClass}`}>{paymentStatusLabel}</span>
                <strong className={styles.total}>{formatCents(order.totalCents)}</strong>
            </p>

            <ol className={styles.progress} aria-label="Progresso do pedido">
                {Array.from({ length: PROGRESS_MARK_COUNT }, (_, index) => (
                    <li key={index} className={index < reachedMarks ? `${styles.mark} ${styles.markReached}` : styles.mark} />
                ))}
            </ol>

            <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                {nextStep ? (
                    <Button disabled={isPending} onClick={() => onChangeStatus(order.id, nextStep.next)}>
                        {nextStep.label}
                    </Button>
                ) : null}
                {notifyUrl ? (
                    <a className={styles.notify} href={notifyUrl} target="_blank" rel="noopener noreferrer">
                        Avisar cliente
                    </a>
                ) : null}
            </div>

            {finishedAt ? <p className={styles.footer}>Concluído às {finishedAt}</p> : null}
        </article>
    )
}
