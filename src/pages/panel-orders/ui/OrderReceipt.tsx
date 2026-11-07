import { createPortal } from 'react-dom'

import { describeOrderDeadline, FULFILLMENT_LABELS, PAYMENT_LABELS, type PanelOrder } from '@/entities/order'
import type { Store } from '@/entities/store'
import { formatBrazilianPhone, formatCep, formatCents } from '@/shared/lib'

import { describeChangeNote } from '../model/change-note'
import { summarizeOptionGroups } from '../model/option-groups'
import { formatOrderDateTime } from '../model/order-moment'
import styles from './order-receipt.module.css'

type OrderReceiptProps = {
    order: PanelOrder
    store: Store
}

function describeReceiptAddress(order: PanelOrder): string | null {
    const address = order.address
    if (!address) {
        return null
    }

    const cityLine = [address.city, address.state].filter(Boolean).join('/')
    const cepLine = address.cep ? `CEP ${formatCep(address.cep)}` : ''
    const parts = [`${address.street}, ${address.number}`, address.complement, address.neighborhood, cityLine, cepLine]
    const reference = address.reference ? ` Ref.: ${address.reference}` : ''
    const description = `${parts.filter(Boolean).join(', ')}.${reference}`
    return description
}

// Fica fora da raiz da página: ao imprimir, a raiz some e só a comanda sai.
export function OrderReceipt({ order, store }: OrderReceiptProps) {
    const address = describeReceiptAddress(order)
    const changeNote = describeChangeNote(order.changeForCents, order.totalCents)
    const deadline = describeOrderDeadline(order.createdAt, store.prepTimeMinutes, store.timezone, order.fulfillment)

    return createPortal(
        <div className={styles.receipt}>
            <header className={styles.header}>
                <p className={styles.storeName}>{store.name}</p>
                <p className={styles.code}>{order.publicCode}</p>
                <p>{formatOrderDateTime(order.createdAt, store.timezone)}</p>
            </header>

            <section className={styles.block}>
                <p className={styles.strong}>
                    {FULFILLMENT_LABELS[order.fulfillment]} · {deadline}
                </p>
                <p>
                    {order.customerName} · {formatBrazilianPhone(order.customerPhone)}
                </p>
                {address ? <p>{address}</p> : null}
            </section>

            <section className={styles.block}>
                <ul className={styles.items}>
                    {order.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`}>
                            <p className={`${styles.row} ${styles.strong}`}>
                                <span>
                                    {item.quantity}x {item.name}
                                </span>
                                <span>{formatCents(item.totalCents)}</span>
                            </p>
                            {summarizeOptionGroups(item.options).map((group) => (
                                <p key={group.title} className={styles.detail}>
                                    {group.title}: {group.choices}
                                </p>
                            ))}
                            {item.notes ? <p className={styles.detail}>Obs.: {item.notes}</p> : null}
                        </li>
                    ))}
                </ul>
            </section>

            <section className={styles.block}>
                <p className={styles.row}>
                    <span>Subtotal</span>
                    <span>{formatCents(order.subtotalCents)}</span>
                </p>
                {order.fulfillment === 'delivery' ? (
                    <p className={styles.row}>
                        <span>Frete</span>
                        <span>{formatCents(order.deliveryFeeCents)}</span>
                    </p>
                ) : null}
                {order.paymentFeeCents > 0 ? (
                    <p className={styles.row}>
                        <span>Taxa de pagamento</span>
                        <span>{formatCents(order.paymentFeeCents)}</span>
                    </p>
                ) : null}
                <p className={`${styles.row} ${styles.strong}`}>
                    <span>Total</span>
                    <span>{formatCents(order.totalCents)}</span>
                </p>
                <p>Pagamento: {PAYMENT_LABELS[order.paymentMethod]}</p>
                {changeNote ? <p>{changeNote}</p> : null}
            </section>

            {order.notes ? (
                <section className={styles.block}>
                    <p>Observação do pedido: {order.notes}</p>
                </section>
            ) : null}
        </div>,
        document.body,
    )
}
