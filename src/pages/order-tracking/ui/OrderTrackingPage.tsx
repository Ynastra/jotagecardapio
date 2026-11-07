import { Link, useParams } from 'react-router-dom'

import {
    buildWhatsappUrl,
    describeOrderDeadline,
    formatClockTime,
    PAYMENT_LABELS,
    type OrderLine,
} from '@/entities/order'
import { buildBrandStyle, formatCents, ThemeProvider } from '@/shared/lib'
import { Button, PixPayment, StatusMessage, ThemeIcon, ThemeImage } from '@/shared/ui'

import { buildTimeline, type TimelineStep } from '../model/timeline'
import type { OrderTracking } from '../model/types'
import { useOrderTracking } from '../model/use-order-tracking'
import styles from './order-tracking.module.css'

const STEP_STYLES: Record<TimelineStep['state'], string> = {
    done: styles.stepDone,
    current: styles.stepCurrent,
    upcoming: '',
}

function describeOptions(line: OrderLine): string {
    const description = line.options
        .map((option) => (option.quantity > 1 ? `${option.quantity}x ${option.name}` : option.name))
        .join(', ')
    return description
}

function Timeline({ tracking }: { tracking: OrderTracking }) {
    const steps = buildTimeline(tracking)

    return (
        <ol className={styles.timeline} aria-label="Andamento do pedido">
            {steps.map((step) => (
                <li
                    key={step.key}
                    className={`${styles.step} ${STEP_STYLES[step.state]}`}
                    aria-current={step.state === 'current' ? 'step' : undefined}
                >
                    <span className={styles.marker} aria-hidden />
                    <span className={styles.stepLabel}>{step.label}</span>
                    {step.at ? (
                        <time className={styles.stepTime} dateTime={step.at}>
                            {formatClockTime(step.at, tracking.store.timezone)}
                        </time>
                    ) : null}
                </li>
            ))}
        </ol>
    )
}

function OrderItems({ tracking }: { tracking: OrderTracking }) {
    const { items, subtotalCents, deliveryFeeCents, paymentFeeCents, totalCents, fulfillment } = tracking

    return (
        <section className={styles.card} aria-labelledby="itens-do-pedido">
            <h2 id="itens-do-pedido" className={styles.sectionTitle}>
                Itens do pedido
            </h2>
            <ul className={styles.items}>
                {items.map((line, index) => (
                    <li key={`${line.productId}-${index}`} className={styles.item}>
                        <div className={styles.itemInfo}>
                            <span>
                                {line.quantity}x {line.name}
                            </span>
                            {line.options.length > 0 ? <span className={styles.itemDetail}>{describeOptions(line)}</span> : null}
                            {line.notes ? <span className={styles.itemDetail}>Obs.: {line.notes}</span> : null}
                        </div>
                        <strong>{formatCents(line.totalCents)}</strong>
                    </li>
                ))}
            </ul>
            <dl className={styles.totals}>
                <div className={styles.totalRow}>
                    <dt>Subtotal</dt>
                    <dd>{formatCents(subtotalCents)}</dd>
                </div>
                {fulfillment === 'delivery' ? (
                    <div className={styles.totalRow}>
                        <dt>Entrega</dt>
                        <dd>{deliveryFeeCents > 0 ? formatCents(deliveryFeeCents) : 'Grátis'}</dd>
                    </div>
                ) : null}
                {paymentFeeCents > 0 ? (
                    <div className={styles.totalRow}>
                        <dt>Taxa de pagamento</dt>
                        <dd>{formatCents(paymentFeeCents)}</dd>
                    </div>
                ) : null}
                <div className={`${styles.totalRow} ${styles.total}`}>
                    <dt>Total</dt>
                    <dd>{formatCents(totalCents)}</dd>
                </div>
            </dl>
            <p className={styles.paymentMethod}>Pagamento: {PAYMENT_LABELS[tracking.paymentMethod]}</p>
        </section>
    )
}

function TrackingView({ tracking }: { tracking: OrderTracking }) {
    const { store } = tracking
    const isFinished = tracking.status === 'completed' || tracking.status === 'canceled'
    const deadline = describeOrderDeadline(tracking.createdAt, store.prepTimeMinutes, store.timezone, tracking.fulfillment)
    const needsPixPayment =
        tracking.paymentMethod === 'pix' &&
        tracking.paymentStatus === 'pending' &&
        tracking.status !== 'canceled' &&
        store.pixKey !== null
    const receiptUrl = buildWhatsappUrl(store.whatsapp, `Comprovante do pedido ${tracking.publicCode}`)
    const contactUrl = buildWhatsappUrl(store.whatsapp, `Olá! Sobre o pedido ${tracking.publicCode}.`)

    return (
        <div className={styles.page} style={buildBrandStyle(store)}>
            <main className={styles.content}>
                <header className={styles.store}>
                    <ThemeImage
                        className={styles.logo}
                        src={store.logoUrl}
                        fallbackStem="logo-padrao-loja"
                        alt={`Logo ${store.name}`}
                    />
                    <h1 className={styles.storeName}>{store.name}</h1>
                </header>

                <div className={styles.summary}>
                    <p className={styles.code}>Pedido {tracking.publicCode}</p>
                    {isFinished ? null : <p className={styles.deadline}>{deadline}</p>}
                </div>

                {tracking.status === 'canceled' ? <p className={styles.canceled}>Este pedido foi cancelado. Fale com a loja se tiver dúvida.</p> : null}

                <section className={styles.card} aria-label="Etapas do pedido">
                    <Timeline tracking={tracking} />
                </section>

                {needsPixPayment && store.pixKey ? (
                    <PixPayment
                        totalCents={tracking.totalCents}
                        pixKey={store.pixKey}
                        pixKeyKind={store.pixKeyType}
                        receiptUrl={receiptUrl}
                    />
                ) : null}

                <OrderItems tracking={tracking} />

                <div className={styles.actions}>
                    <a className={styles.secondary} href={contactUrl} target="_blank" rel="noopener noreferrer">
                        <ThemeIcon name="whatsapp" size={22} />
                        Falar com a loja
                    </a>
                    <Link className={styles.primary} to={`/${store.slug}`}>
                        Ver cardápio
                    </Link>
                </div>
            </main>
        </div>
    )
}

export function OrderTrackingPage() {
    const { slug = '', token = '' } = useParams()
    const state = useOrderTracking(token)
    const folders = state.status === 'ready' ? [state.tracking.store.slug, state.tracking.store.theme] : ['base']

    return (
        <ThemeProvider folders={folders}>
            {state.status === 'loading' ? <p className={styles.loading}>Carregando pedido</p> : null}
            {state.status === 'ready' ? <TrackingView tracking={state.tracking} /> : null}
            {state.status === 'not-found' ? (
                <StatusMessage illustration="nao-encontrado" title="Pedido não encontrado">
                    <p>Confira o link que você recebeu da loja.</p>
                    <Link className={styles.primary} to={`/${slug}`}>
                        Ver cardápio
                    </Link>
                </StatusMessage>
            ) : null}
            {state.status === 'error' ? (
                <StatusMessage illustration="erro-conexao" title="Não deu para abrir o pedido">
                    <p>Confira a internet e tente de novo.</p>
                    <Button onClick={() => window.location.reload()}>Tentar de novo</Button>
                </StatusMessage>
            ) : null}
        </ThemeProvider>
    )
}
