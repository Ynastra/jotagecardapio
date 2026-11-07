import { useCallback, useMemo, useState } from 'react'

import { buildStatusMessage, type OrderPaymentStatus, type OrderStatus, type PanelOrder } from '@/entities/order'
import type { Store } from '@/entities/store'

import { groupOrdersIntoColumns, sumCompletedCents, type BoardColumns } from './board'
import { buildCustomerWhatsappUrl, buildTrackingUrl } from './customer-contact'
import { filterOrders, type ChannelFilter } from './filters'
import { isActiveOrder } from './order-flow'
import { getPeriodStart, type PeriodKey } from './period'
import { usePanelOrders } from './use-panel-orders'
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
    changeStatus: (orderId: string, status: OrderStatus) => Promise<void>
    changePaymentStatus: (orderId: string, paymentStatus: OrderPaymentStatus) => Promise<void>
    findOrder: (orderId: string) => PanelOrder | null
    isFresh: (order: PanelOrder) => boolean
    markSeen: (orderId: string) => void
    getNotifyUrl: (order: PanelOrder) => string | null
    getTrackingUrl: (order: PanelOrder) => string
}

export function useOrderBoard(store: Store): OrderBoardState {
    const [channel, setChannel] = useState<ChannelFilter>('all')
    const [search, setSearch] = useState('')
    const [period, setPeriod] = useState<PeriodKey>('today')
    const [seenIds, setSeenIds] = useState<ReadonlySet<string>>(new Set())

    const periodStart = useMemo(() => getPeriodStart(period, new Date(), store.timezone), [period, store.timezone])
    const { orders, isLoading, isTruncated, errorMessage, changeStatus, changePaymentStatus } = usePanelOrders(
        store.id,
        periodStart,
    )
    const statusMessages = useStatusMessages(store.id)

    const visibleOrders = useMemo(
        () => filterOrders(orders, { channel, search, periodStart }),
        [orders, channel, search, periodStart],
    )
    const columns = useMemo(() => groupOrdersIntoColumns(visibleOrders), [visibleOrders])
    const finishedTotalCents = sumCompletedCents(columns.finished)
    const activeCount = orders.filter(isActiveOrder).length

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

    const getTrackingUrl = useCallback(
        (order: PanelOrder) => {
            const url = buildTrackingUrl(window.location.origin, store.slug, order)
            return url
        },
        [store.slug],
    )

    const getNotifyUrl = useCallback(
        (order: PanelOrder) => {
            const trackingUrl = getTrackingUrl(order)
            const message = buildStatusMessage(order, { storeName: store.name, trackingUrl, stored: statusMessages })
            const url = message ? buildCustomerWhatsappUrl(order, message) : null
            return url
        },
        [store.name, statusMessages, getTrackingUrl],
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
        hasNoOrders: !isLoading && orders.length === 0,
        isLoading,
        isTruncated,
        errorMessage,
        changeStatus,
        changePaymentStatus,
        findOrder,
        isFresh,
        markSeen,
        getNotifyUrl,
        getTrackingUrl,
    }
}
