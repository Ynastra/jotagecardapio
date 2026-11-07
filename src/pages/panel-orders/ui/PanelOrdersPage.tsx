import { useEffect } from 'react'

import type { PanelOrder } from '@/entities/order'
import { useCurrentStore } from '@/entities/store'
import { formatCents, unlockChime } from '@/shared/lib'
import { StatusMessage } from '@/shared/ui'

import { ORDERS_QUERY_LIMIT } from '../model/board'
import { useOrderBoard } from '../model/use-order-board'
import { BoardCard } from './BoardCard'
import { BoardColumn, type ColumnTone } from './BoardColumn'
import { BoardToolbar } from './BoardToolbar'
import styles from './order-board.module.css'

const COLUMN_DEFINITIONS = [
    { key: 'received', id: 'coluna-novos', title: 'Novos', tone: 'received' },
    { key: 'preparing', id: 'coluna-em-preparo', title: 'Em preparo', tone: 'preparing' },
    { key: 'ready', id: 'coluna-saiu-pronto', title: 'Saiu ou pronto', tone: 'ready' },
    { key: 'finished', id: 'coluna-concluidos', title: 'Concluídos', tone: 'finished' },
] as const satisfies readonly { key: string; id: string; title: string; tone: ColumnTone }[]

function jumpToColumn(columnId: string) {
    document.getElementById(columnId)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
}

export function PanelOrdersPage() {
    const store = useCurrentStore()
    const board = useOrderBoard(store)

    useEffect(() => {
        const base = `Pedidos · ${store.name}`
        document.title = board.activeCount > 0 ? `(${board.activeCount}) ${base}` : base
    }, [board.activeCount, store.name])

    function renderCard(order: PanelOrder) {
        return (
            <BoardCard
                key={order.id}
                order={order}
                timeZone={store.timezone}
                isFresh={board.isFresh(order)}
                notifyUrl={board.getNotifyUrl(order)}
                onChangeStatus={board.changeStatus}
                onOpen={board.markSeen}
            />
        )
    }

    return (
        <div className={styles.page} onPointerDown={unlockChime}>
            <h1 className={styles.title}>Pedidos</h1>

            <BoardToolbar
                channel={board.channel}
                onChannelChange={board.setChannel}
                search={board.search}
                onSearchChange={board.setSearch}
                period={board.period}
                onPeriodChange={board.setPeriod}
                orderCount={board.visibleCount}
            />

            <select
                className={styles.columnPicker}
                aria-label="Ir para a coluna"
                defaultValue={COLUMN_DEFINITIONS[0].id}
                onChange={(event) => jumpToColumn(event.target.value)}
            >
                {COLUMN_DEFINITIONS.map((column) => (
                    <option key={column.id} value={column.id}>
                        {column.title} ({board.columns[column.key].length})
                    </option>
                ))}
            </select>

            {board.errorMessage ? (
                <p className={styles.error} role="alert">
                    {board.errorMessage}
                </p>
            ) : null}
            {board.isTruncated ? <p className={styles.notice}>Mostrando os {ORDERS_QUERY_LIMIT} mais recentes</p> : null}
            {board.isLoading ? <p className={styles.muted}>Carregando pedidos</p> : null}
            {board.hasNoOrders ? (
                <StatusMessage illustration="painel-sem-pedidos" title="Nenhum pedido ainda">
                    <p>Os pedidos aparecem aqui na hora, com um aviso sonoro.</p>
                </StatusMessage>
            ) : null}

            <div className={styles.board}>
                {COLUMN_DEFINITIONS.map((column) => {
                    const columnOrders = board.columns[column.key]
                    const totalLabel = column.key === 'finished' ? formatCents(board.finishedTotalCents) : undefined
                    return (
                        <BoardColumn
                            key={column.id}
                            columnId={column.id}
                            title={column.title}
                            tone={column.tone}
                            count={columnOrders.length}
                            totalLabel={totalLabel}
                        >
                            {columnOrders.map(renderCard)}
                        </BoardColumn>
                    )
                })}
            </div>
        </div>
    )
}
