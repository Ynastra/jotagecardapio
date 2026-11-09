import { createPortal } from 'react-dom'

import {
    describeOrderDeadline,
    formatClockTime,
    PAYMENT_LABELS,
    type Fulfillment,
    type PanelOrder,
} from '@/entities/order'
import type { Store } from '@/entities/store'
import {
    formatBrazilianPhone,
    formatCep,
    formatCents,
    formatNationalPhone,
    ThemeProvider,
    useThemeAsset,
} from '@/shared/lib'

import { describeChangeNote } from '../model/change-note'
import { listOptionAnswers } from '../model/option-groups'
import styles from './order-receipt.module.css'

type OrderReceiptProps = {
    order: PanelOrder
    store: Store
}

const KIND_TITLES: Record<Fulfillment, string> = {
    delivery: 'ENTREGA',
    pickup: 'RETIRADA',
}

const PAYMENT_MOMENTS: Record<Fulfillment, string> = {
    delivery: 'Na entrega',
    pickup: 'Na retirada',
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

function ReceiptStamp() {
    const stampUrl = useThemeAsset('logo-comanda', ['png', 'svg'])
    if (!stampUrl) {
        return null
    }

    return <img className={styles.stamp} src={stampUrl} alt="" />
}

// Fica fora da raiz da página: ao imprimir, a raiz some e só a comanda sai.
export function OrderReceipt({ order, store }: OrderReceiptProps) {
    const address = describeReceiptAddress(order)
    const changeNote = describeChangeNote(order.changeForCents, order.totalCents)
    const deadline = describeOrderDeadline(order.createdAt, store.prepTimeMinutes, store.timezone, order.fulfillment)
    const orderTime = formatClockTime(order.createdAt, store.timezone)

    return createPortal(
        <div className={styles.receipt}>
            <ThemeProvider folders={[store.slug]}>
                <ReceiptStamp />
            </ThemeProvider>

            <div className={styles.kindBox}>
                <p className={styles.kind}>{KIND_TITLES[order.fulfillment]}</p>
                <p className={styles.code}>{order.publicCode}</p>
            </div>

            <div className={styles.customer}>
                <p className={styles.row}>
                    <span className={styles.strong}>{order.customerName}</span>
                    <span className={styles.soft}>{orderTime}</span>
                </p>
                <p className={styles.row}>
                    <span className={styles.soft}>{formatBrazilianPhone(order.customerPhone)}</span>
                    <span className={styles.strong}>{deadline}</span>
                </p>
            </div>

            {address ? (
                <div className={styles.delivery}>
                    <p className={styles.deliveryLabel}>Entregar em</p>
                    <p>{address}</p>
                </div>
            ) : null}

            <ul className={styles.items}>
                {order.items.map((item, index) => {
                    const quantityPrefix = item.quantity > 1 ? `${item.quantity}x ` : ''
                    const answers = listOptionAnswers(item.options)

                    return (
                        <li key={`${item.productId}-${index}`} className={styles.item}>
                            <p className={styles.band}>
                                <span>
                                    {index + 1} · {quantityPrefix}
                                    {item.name.toUpperCase()}
                                </span>
                                <span>{formatCents(item.totalCents)}</span>
                            </p>
                            {answers.length > 0 ? (
                                <ul className={styles.answers}>
                                    {answers.map((answer, answerIndex) => (
                                        <li key={`${answer}-${answerIndex}`}>{answer}</li>
                                    ))}
                                </ul>
                            ) : null}
                            {item.notes ? <p className={styles.noteBox}>OBS: {item.notes}</p> : null}
                        </li>
                    )
                })}
            </ul>

            <div className={styles.totals}>
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
                    <span>TOTAL</span>
                    <span>{formatCents(order.totalCents)}</span>
                </p>
                <p className={styles.strong}>
                    {PAYMENT_MOMENTS[order.fulfillment]} | {PAYMENT_LABELS[order.paymentMethod]}
                </p>
                {changeNote ? <p>{changeNote}</p> : null}
            </div>

            {order.notes ? <p className={styles.noteBox}>Observação do pedido: {order.notes}</p> : null}

            <p className={styles.footer}>
                {store.name} · {formatNationalPhone(store.whatsapp)}
            </p>
        </div>,
        document.body,
    )
}
