import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { PanelOrder } from '@/entities/order'
import { useCurrentStore } from '@/entities/store'
import { formatCents, unlockChime } from '@/shared/lib'
import { StatusMessage } from '@/shared/ui'

import { ORDERS_QUERY_LIMIT } from '../model/board'
import { useLinkedOrder, type LinkedOrderFailure } from '../model/use-linked-order'
import { buildSampleOrder } from '../model/sample-order'
import { useOrderBoard } from '../model/use-order-board'
import { usePrintQueue } from '../model/use-print-queue'
import { BoardCard } from './BoardCard'
import { BoardColumn, type ColumnTone } from './BoardColumn'
import { BoardToolbar } from './BoardToolbar'
import { OrderDrawer } from './OrderDrawer'
import { PrintControls } from './PrintControls'
import { PrintStation } from './PrintStation'
import styles from './order-board.module.css'

const COLUMN_DEFINITIONS = [
    { key: 'received', id: 'coluna-novos', title: 'Novos', tone: 'received' },
    { key: 'preparing', id: 'coluna-em-preparo', title: 'Em preparo', tone: 'preparing' },
    { key: 'ready', id: 'coluna-saiu-pronto', title: 'Saiu ou pronto', tone: 'ready' },
    { key: 'finished', id: 'coluna-concluidos', title: 'Concluídos', tone: 'finished' },
] as const satisfies readonly { key: string; id: string; title: string; tone: ColumnTone }[]

const OPEN_ORDER_PARAM = 'pedido'
const LINK_NOTICE_MS = 6000
const MANUAL_PRINT_COPIES = 1

const LINK_NOTICE_MESSAGES: Record<LinkedOrderFailure, string> = {
    'not-found': 'Pedido não encontrado',
    failed: 'Não deu para carregar o pedido. Confira a internet.',
}

function jumpToColumn(columnId: string) {
    document.getElementById(columnId)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
}

export function PanelOrdersPage() {
    const store = useCurrentStore()
    const [searchParams, setSearchParams] = useSearchParams()
    const [linkNotice, setLinkNotice] = useState<LinkedOrderFailure | null>(null)
    const openOrderId = searchParams.get(OPEN_ORDER_PARAM)
    const printQueue = usePrintQueue(store.id)
    const board = useOrderBoard(store, openOrderId, printQueue.printNewOrder)
    const openOrder = openOrderId ? board.findOrder(openOrderId) : null

    function openDrawer(orderId: string) {
        board.markSeen(orderId)
        setLinkNotice(null)
        setSearchParams({ [OPEN_ORDER_PARAM]: orderId })
    }

    function closeDrawer() {
        setSearchParams({})
    }

    function reportLinkedOrderFailure(failure: LinkedOrderFailure) {
        setLinkNotice(failure)
        setSearchParams({})
    }

    useLinkedOrder({
        storeId: store.id,
        orderId: openOrderId,
        isListed: openOrder !== null,
        isBoardLoading: board.isLoading,
        onFound: board.adoptOrder,
        onMissing: reportLinkedOrderFailure,
    })

    useEffect(() => {
        if (!linkNotice) {
            return
        }

        const timer = window.setTimeout(() => setLinkNotice(null), LINK_NOTICE_MS)
        return () => window.clearTimeout(timer)
    }, [linkNotice])

    useEffect(() => {
        if (openOrderId) {
            board.markSeen(openOrderId)
        }
    }, [openOrderId, board.markSeen])

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
                isPending={board.isPending(order.id)}
                notifyUrl={board.getNotifyUrl(order)}
                onChangeStatus={board.changeStatus}
                onOpen={openDrawer}
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

            <PrintControls
                storeId={store.id}
                onTest={(copies) => printQueue.printOrder(buildSampleOrder(new Date()), copies)}
            />

            {board.errorMessage ? (
                <p className={styles.error} role="alert">
                    {board.errorMessage}
                </p>
            ) : null}
            {linkNotice ? (
                <div className={`${styles.error} ${styles.dismissible}`} role="alert">
                    <p>{LINK_NOTICE_MESSAGES[linkNotice]}</p>
                    <button type="button" className={styles.dismiss} onClick={() => setLinkNotice(null)}>
                        Fechar
                    </button>
                </div>
            ) : null}
            {board.autoNotice ? (
                <p className={styles.notice} role="status">
                    {board.autoNotice}
                </p>
            ) : null}
            {board.isTruncated ? <p className={styles.notice}>Mostrando os {ORDERS_QUERY_LIMIT} mais recentes</p> : null}
            {board.isLoading ? <p className={styles.muted}>Carregando pedidos</p> : null}
            {board.hasNoOrders ? (
                <StatusMessage illustration="painel-sem-pedidos" title="Nenhum pedido ainda">
                    <p>Os pedidos aparecem aqui na hora, com um aviso sonoro.</p>
                </StatusMessage>
            ) : null}

            <div className={styles.boardArea}>
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

            {openOrder ? (
                <OrderDrawer
                    key={openOrder.id}
                    order={openOrder}
                    store={store}
                    trackingUrl={board.getTrackingUrl(openOrder)}
                    notifyUrl={board.getNotifyUrl(openOrder)}
                    isPending={board.isPending(openOrder.id)}
                    onClose={closeDrawer}
                    onChangeStatus={board.changeStatus}
                    onChangePayment={board.changePaymentStatus}
                    onPrint={(order) => printQueue.printOrder(order, MANUAL_PRINT_COPIES)}
                />
            ) : null}

            <PrintStation store={store} job={printQueue.currentJob} onDone={printQueue.finishJob} />
        </div>
    )
}
