import { useState } from 'react'

import {
    describeOrderDeadline,
    PAYMENT_LABELS,
    type OrderAddress,
    type OrderPaymentStatus,
    type PanelOrder,
} from '@/entities/order'
import type { Store } from '@/entities/store'
import { formatBrazilianPhone, formatCep, formatCents } from '@/shared/lib'
import { Button } from '@/shared/ui'

import { describeChangeNote } from '../model/change-note'
import { buildCustomerWhatsappUrl } from '../model/customer-contact'
import { summarizeOptionGroups } from '../model/option-groups'
import { buildOrderTimeline } from '../model/order-timeline'
import { useCustomerOrderCount } from '../model/use-customer-order-count'
import styles from './order-drawer.module.css'

type OrderDetailProps = {
    order: PanelOrder
    store: Store
    trackingUrl: string
    notifyUrl: string | null
    isPending: boolean
    onChangePayment: (orderId: string, paymentStatus: OrderPaymentStatus) => void
}

function describeFullAddress(address: OrderAddress): string[] {
    const cityLine = [address.city, address.state].filter(Boolean).join('/')
    const cepLine = address.cep ? `CEP ${formatCep(address.cep)}` : ''
    const lines = [
        `${address.street}, ${address.number}`,
        address.complement,
        address.neighborhood,
        cityLine,
        cepLine,
        address.reference ? `Referência: ${address.reference}` : '',
    ].filter(Boolean)
    return lines
}

function describeOrderCount(count: number | null): string | null {
    if (count === null) {
        return null
    }
    const description = count <= 1 ? 'Primeiro pedido' : `${count} pedidos na sua loja`
    return description
}

export function OrderDetail({ order, store, trackingUrl, notifyUrl, isPending, onChangePayment }: OrderDetailProps) {
    const [isLinkCopied, setLinkCopied] = useState(false)
    const orderCount = useCustomerOrderCount(store.id, order.customerPhone)
    const orderCountLabel = describeOrderCount(orderCount)
    const timeline = buildOrderTimeline(order, store.timezone)
    const changeNote = describeChangeNote(order.changeForCents, order.totalCents)
    const isPaid = order.paymentStatus === 'paid'
    const nextPaymentStatus: OrderPaymentStatus = isPaid ? 'pending' : 'paid'
    const deadline = describeOrderDeadline(order.createdAt, store.prepTimeMinutes, store.timezone, order.fulfillment)

    async function copyTrackingLink() {
        await navigator.clipboard.writeText(trackingUrl)
        setLinkCopied(true)
    }

    return (
        <>
            <span className={styles.badge}>{deadline}</span>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Andamento</h3>
                <ol className={styles.timeline}>
                    {timeline.map((entry) => (
                        <li
                            key={entry.label}
                            className={entry.time ? `${styles.timelineEntry} ${styles.timelineReached}` : styles.timelineEntry}
                        >
                            <span>{entry.label}</span>
                            <span>{entry.time ?? ''}</span>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Cliente</h3>
                <strong>{order.customerName}</strong>
                {orderCountLabel ? <span className={styles.muted}>{orderCountLabel}</span> : null}
                <span>{formatBrazilianPhone(order.customerPhone)}</span>
                <div className={styles.actionRow}>
                    <a
                        className={styles.link}
                        href={buildCustomerWhatsappUrl(order, '')}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Enviar mensagem
                    </a>
                    {notifyUrl ? (
                        <a className={styles.link} href={notifyUrl} target="_blank" rel="noopener noreferrer">
                            Avisar cliente
                        </a>
                    ) : null}
                    <button type="button" className={styles.link} onClick={copyTrackingLink}>
                        {isLinkCopied ? 'Link copiado' : 'Copiar link do pedido'}
                    </button>
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Pagamento</h3>
                <div className={styles.row}>
                    <span>{PAYMENT_LABELS[order.paymentMethod]}</span>
                    <Button
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => onChangePayment(order.id, nextPaymentStatus)}
                    >
                        {isPaid ? 'Pago' : 'Pendente'}
                    </Button>
                </div>
                {order.paymentMethod === 'pix' && !isPaid ? (
                    <p className={styles.warning}>Confira o comprovante antes de marcar como pago</p>
                ) : null}
                <p className={`${styles.row} ${styles.muted}`}>
                    <span>Subtotal</span>
                    <span>{formatCents(order.subtotalCents)}</span>
                </p>
                {order.fulfillment === 'delivery' ? (
                    <p className={`${styles.row} ${styles.muted}`}>
                        <span>Frete</span>
                        <span>{formatCents(order.deliveryFeeCents)}</span>
                    </p>
                ) : null}
                {order.paymentFeeCents > 0 ? (
                    <p className={`${styles.row} ${styles.muted}`}>
                        <span>Taxa de pagamento</span>
                        <span>{formatCents(order.paymentFeeCents)}</span>
                    </p>
                ) : null}
                <p className={`${styles.row} ${styles.rowTotal}`}>
                    <span>Total</span>
                    <span>{formatCents(order.totalCents)}</span>
                </p>
                {changeNote ? <p>{changeNote}</p> : null}
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Itens</h3>
                <ul className={styles.items}>
                    {order.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`}>
                            <div className={styles.row}>
                                <span className={styles.itemName}>
                                    {item.quantity}x {item.name}
                                </span>
                                <span>{formatCents(item.totalCents)}</span>
                            </div>
                            {summarizeOptionGroups(item.options).map((group) => (
                                <p key={group.title} className={styles.optionGroup}>
                                    {group.title}: {group.choices}
                                </p>
                            ))}
                            {item.notes ? <p className={styles.itemNote}>Obs.: {item.notes}</p> : null}
                        </li>
                    ))}
                </ul>
            </section>

            {order.notes ? (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Observação do pedido</h3>
                    <p>{order.notes}</p>
                </section>
            ) : null}

            {order.address ? (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Endereço de entrega</h3>
                    {describeFullAddress(order.address).map((line) => (
                        <span key={line}>{line}</span>
                    ))}
                </section>
            ) : null}
        </>
    )
}
