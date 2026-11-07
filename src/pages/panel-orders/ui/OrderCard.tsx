import { useState } from 'react'

import { FULFILLMENT_LABELS, getStatusLabel, PAYMENT_LABELS, type OrderStatus, type PanelOrder } from '@/entities/order'
import { formatBrazilianPhone, formatCents } from '@/shared/lib'
import { Button, ThemeIcon } from '@/shared/ui'

import { getNextStep, isActiveOrder } from '../model/order-flow'
import styles from './panel-orders.module.css'

const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

const STATUS_CLASSES: Record<OrderStatus, string> = {
    received: styles.statusReceived,
    preparing: styles.statusPreparing,
    ready: styles.statusReady,
    completed: styles.statusCompleted,
    canceled: styles.statusCanceled,
}

type OrderCardProps = {
    order: PanelOrder
    onChangeStatus: (orderId: string, status: OrderStatus) => void
}

function describeAddress(order: PanelOrder): string {
    const address = order.address
    if (!address) {
        return FULFILLMENT_LABELS.pickup
    }

    const parts = [`${address.street}, ${address.number}`, address.neighborhood, address.complement, address.reference]
    const description = parts.filter(Boolean).join(' · ')
    return description
}

export function OrderCard({ order, onChangeStatus }: OrderCardProps) {
    const [isConfirmingCancel, setConfirmingCancel] = useState(false)
    const nextStep = getNextStep(order.status, order.fulfillment)
    const isActive = isActiveOrder(order)
    const changeNote = order.changeForCents ? ` · troco para ${formatCents(order.changeForCents)}` : ''

    return (
        <article className={`${styles.order} ${STATUS_CLASSES[order.status]}`}>
            <header className={styles.orderHeader}>
                <h2 className={styles.orderNumber}>#{order.number}</h2>
                <span className={styles.orderStatus}>{getStatusLabel(order.status, order.fulfillment)}</span>
                <time className={styles.orderTime} dateTime={order.createdAt}>
                    {timeFormatter.format(new Date(order.createdAt))}
                </time>
            </header>

            <p className={styles.orderLine}>
                <strong>{order.customerName}</strong>
                <a href={`tel:${order.customerPhone}`} className={styles.phone}>
                    <ThemeIcon name="telefone" size={16} />
                    {formatBrazilianPhone(order.customerPhone)}
                </a>
            </p>
            <p className={styles.orderLine}>
                <ThemeIcon name={order.fulfillment === 'delivery' ? 'entrega' : 'retirada'} size={18} />
                {describeAddress(order)}
            </p>

            <ul className={styles.items}>
                {order.items.map((item, index) => (
                    <li key={`${item.productId}-${index}`}>
                        <strong>
                            {item.quantity}x {item.name}
                        </strong>
                        {item.options.map((option) => (
                            <span key={option.optionId} className={styles.itemDetail}>
                                {option.quantity > 1 ? `${option.quantity}x ` : ''}
                                {option.name}
                            </span>
                        ))}
                        {item.notes ? <span className={styles.itemNote}>Obs.: {item.notes}</span> : null}
                    </li>
                ))}
            </ul>

            {order.notes ? <p className={styles.itemNote}>Observação do pedido: {order.notes}</p> : null}

            <p className={styles.orderTotal}>
                <span>
                    {PAYMENT_LABELS[order.paymentMethod]}
                    {changeNote}
                </span>
                <strong>{formatCents(order.totalCents)}</strong>
            </p>

            {isActive ? (
                <div className={styles.actions}>
                    {nextStep ? <Button onClick={() => onChangeStatus(order.id, nextStep.next)}>{nextStep.label}</Button> : null}
                    {isConfirmingCancel ? (
                        <Button variant="secondary" onClick={() => onChangeStatus(order.id, 'canceled')}>
                            Confirmar cancelamento
                        </Button>
                    ) : (
                        <Button variant="ghost" onClick={() => setConfirmingCancel(true)}>
                            Cancelar
                        </Button>
                    )}
                </div>
            ) : null}
        </article>
    )
}
