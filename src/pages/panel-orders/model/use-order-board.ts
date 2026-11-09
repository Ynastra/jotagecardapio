import { useCallback, useMemo, useState } from 'react'

import { buildStatusMessage, type OrderPaymentStatus, type OrderStatus, type PanelOrder } from '@/entities/order'
import type { Store } from '@/entities/store'

import { groupOrdersIntoColumns, sumCompletedCents, type BoardColumns } from './board'
import { buildCustomerWhatsappUrl, buildTrackingUrl } from './customer-contact'
import { filterOrders, isVisibleInPeriod, type ChannelFilter } from './filters'
import { isActiveOrder } from './order-flow'
import type { PeriodKey } from './period'
import { useAutoNotify } from './use-auto-notify'
import { usePanelOrders } from './use-panel-orders'
import { usePeriodStart } from './use-period-start'
import { useStatusMessages } from './use-status-messages'

export type OrderBoardState = {
    channel: ChannelFilter
    setChannel: (channel: ChannelFilter) => void
    search: string
    setSearch: (search: string) => void
    period: PeriodKey
    setPeriod: (period: PeriodKey) => void
    columns: BoardColumns
    visibleCount: number
    activeCount: number
    finishedTotalCents: number
    hasNoOrders: boolean
    isLoading: boolean
    isTruncated: boolean
    errorMessage: string | null
    autoNotice: string | null
    changeStatus: (orderId: string, status: OrderStatus) => Promise<void>
    changePaymentStatus: (orderId: string, paymentStatus: OrderPaymentStatus) => Promise<void>
    isPending: (orderId: string) => boolean
    adoptOrder: (order: PanelOrder) => void
    findOrder: (orderId: string) => PanelOrder | null
    isFresh: (order: PanelOrder) => boolean
    markSeen: (orderId: string) => void
    getNotifyUrl: (order: PanelOrder) => string | null
    getTrackingUrl: (order: PanelOrder) => string
}

export function useOrderBoard(
    store: Store,
    pinnedOrderId: string | null,
    onNewOrder?: (order: PanelOrder) => void,
): OrderBoardState {
    const [channel, setChannel] = useState<ChannelFilter>('all')
    const [search, setSearch] = useState('')
    const [period, setPeriod] = useState<PeriodKey>('today')
    const [seenIds, setSeenIds] = useState<ReadonlySet<string>>(new Set())

    const periodStart = usePeriodStart(period, store.timezone)
    const statusMessages = useStatusMessages(store.id)

    const getTrackingUrl = useCallback(
        (order: PanelOrder) => {
            const url = buildTrackingUrl(window.location.origin, store.slug, order)
            return url
        },
        [store.slug],
    )

    const buildMessage = useCallback(
        (order: PanelOrder) => {
            const trackingUrl = getTrackingUrl(order)
            const message = buildStatusMessage(order, { storeName: store.name, trackingUrl, stored: statusMessages })
            return message
        },
        [store.name, statusMessages, getTrackingUrl],
    )

    const { notice: autoNotice, notifyCustomer } = useAutoNotify(store.id, buildMessage)
    const { orders, isLoading, isTruncated, errorMessage, pendingOrderIds, changeStatus, changePaymentStatus, adoptOrder } =
        usePanelOrders(store.id, periodStart, pinnedOrderId, notifyCustomer, onNewOrder)

    const visibleOrders = useMemo(
        () => filterOrders(orders, { channel, search, periodStart }),
        [orders, channel, search, periodStart],
    )
    const columns = useMemo(() => groupOrdersIntoColumns(visibleOrders), [visibleOrders])
    const finishedTotalCents = sumCompletedCents(columns.finished)
    const periodOrders = useMemo(
        () => orders.filter((order) => isVisibleInPeriod(order, periodStart)),
        [orders, periodStart],
    )
    const activeCount = periodOrders.filter(isActiveOrder).length

    const isPending = useCallback((orderId: string) => pendingOrderIds.has(orderId), [pendingOrderIds])

    const findOrder = useCallback(
        (orderId: string) => {
            const found = orders.find((order) => order.id === orderId) ?? null
            return found
        },
        [orders],
    )

    const isFresh = useCallback((order: PanelOrder) => order.status === 'received' && !seenIds.has(order.id), [seenIds])

    const markSeen = useCallback((orderId: string) => {
        setSeenIds((current) => new Set(current).add(orderId))
    }, [])

    const getNotifyUrl = useCallback(
        (order: PanelOrder) => {
            const message = buildMessage(order)
            const url = message ? buildCustomerWhatsappUrl(order, message) : null
            return url
        },
        [buildMessage],
    )

    return {
        channel,
        setChannel,
        search,
        setSearch,
        period,
        setPeriod,
        columns,
        visibleCount: visibleOrders.length,
        activeCount,
        finishedTotalCents,
        hasNoOrders: !isLoading && periodOrders.length === 0,
        isLoading,
        isTruncated,
        errorMessage,
        autoNotice,
        changeStatus,
        changePaymentStatus,
        isPending,
        adoptOrder,
        findOrder,
        isFresh,
        markSeen,
        getNotifyUrl,
        getTrackingUrl,
    }
}
