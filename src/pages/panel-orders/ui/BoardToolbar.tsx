import { CHANNEL_OPTIONS, type ChannelFilter } from '../model/filters'
import { PERIOD_OPTIONS, type PeriodKey } from '../model/period'
import styles from './order-board.module.css'

type BoardToolbarProps = {
    channel: ChannelFilter
    onChannelChange: (channel: ChannelFilter) => void
    search: string
    onSearchChange: (search: string) => void
    period: PeriodKey
    onPeriodChange: (period: PeriodKey) => void
    orderCount: number
}

export function BoardToolbar({
    channel,
    onChannelChange,
    search,
    onSearchChange,
    period,
    onPeriodChange,
    orderCount,
}: BoardToolbarProps) {
    const countLabel = orderCount === 1 ? '1 pedido' : `${orderCount} pedidos`

    return (
        <div className={styles.toolbar}>
            <div className={styles.toolbarRow}>
                <div className={styles.tabs} role="group" aria-label="Canal">
                    {CHANNEL_OPTIONS.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            className={option.key === channel ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                            aria-pressed={option.key === channel}
                            onClick={() => onChannelChange(option.key)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <p className={styles.count}>{countLabel}</p>
            </div>
            <div className={styles.toolbarRow}>
                <input
                    className={styles.search}
                    type="search"
                    placeholder="Buscar por cliente ou código"
                    aria-label="Buscar por cliente ou código"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
                <select
                    className={styles.period}
                    aria-label="Período"
                    value={period}
                    onChange={(event) => onPeriodChange(event.target.value as PeriodKey)}
                >
                    {PERIOD_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
