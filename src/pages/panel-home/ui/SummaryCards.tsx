import { averageTicketCents, marketplaceFeeSavingsCents, percentOf, type Dashboard } from '../model/dashboard'
import styles from './panel-home.module.css'

const NO_TICKET_PLACEHOLDER = '-'

type SummaryCardsProps = {
    dashboard: Dashboard
    formatMoney: (cents: number) => string
}

type CardProps = {
    label: string
    value: string
    note?: string
    isNoteWarning?: boolean
}

function Card({ label, value, note, isNoteWarning = false }: CardProps) {
    const noteClass = isNoteWarning ? styles.cardNoteDanger : styles.cardNote

    return (
        <div className={styles.card}>
            <span className={styles.cardLabel}>{label}</span>
            <strong className={styles.cardValue}>{value}</strong>
            {note ? <span className={noteClass}>{note}</span> : null}
        </div>
    )
}

function formatCanceled(count: number): string | undefined {
    if (count === 0) {
        return undefined
    }

    const text = count === 1 ? '1 cancelado' : `${count} cancelados`
    return text
}

function formatShare(count: number, total: number): string {
    const text = `${count} (${percentOf(count, total)}%)`
    return text
}

export function SummaryCards({ dashboard, formatMoney }: SummaryCardsProps) {
    const ticketCents = averageTicketCents(dashboard.revenueCents, dashboard.ordersCount)
    const ticketText = ticketCents === null ? NO_TICKET_PLACEHOLDER : formatMoney(ticketCents)

    return (
        <div className={styles.cards}>
            <Card label="Faturamento" value={formatMoney(dashboard.revenueCents)} />
            <Card
                label="Pedidos"
                value={String(dashboard.ordersCount)}
                note={formatCanceled(dashboard.canceledCount)}
                isNoteWarning
            />
            <Card label="Ticket médio" value={ticketText} />
            <Card label="Clientes" value={String(dashboard.customersCount)} />
            <Card label="Entrega" value={formatShare(dashboard.deliveryCount, dashboard.ordersCount)} />
            <Card label="Retirada" value={formatShare(dashboard.pickupCount, dashboard.ordersCount)} />
            <Card
                label="Economia com taxas"
                value={formatMoney(marketplaceFeeSavingsCents(dashboard.revenueCents))}
                note="o que um marketplace cobraria"
            />
        </div>
    )
}
