import type { MonthlyRevenue } from '../model/dashboard'
import { buildChartBars } from '../model/monthly-chart'
import styles from './panel-home.module.css'

type MonthlyChartProps = {
    series: MonthlyRevenue[]
    formatMoney: (cents: number) => string
}

export function MonthlyChart({ series, formatMoney }: MonthlyChartProps) {
    const bars = buildChartBars(series)

    return (
        <section className={styles.section} aria-labelledby="faturamento-por-mes">
            <h2 id="faturamento-por-mes" className={styles.sectionTitle}>
                Faturamento por mês
            </h2>
            <div className={styles.chartScroll}>
                <ul className={styles.chart}>
                    {bars.map((bar) => (
                        <li
                            key={bar.month}
                            className={styles.bar}
                            tabIndex={0}
                            aria-label={`${bar.label}: ${formatMoney(bar.revenueCents)}`}
                        >
                            <div className={styles.barPlot}>
                                <span className={styles.barValue}>{formatMoney(bar.revenueCents)}</span>
                                <div
                                    className={
                                        bar.isCurrent ? `${styles.barFill} ${styles.barFillCurrent}` : styles.barFill
                                    }
                                    style={{ blockSize: `${bar.heightPercent}%` }}
                                />
                            </div>
                            <span
                                className={
                                    bar.isCurrent ? `${styles.barLabel} ${styles.barLabelCurrent}` : styles.barLabel
                                }
                            >
                                {bar.label}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
            <table className="visually-hidden">
                <caption>Faturamento por mês, últimos 12 meses</caption>
                <thead>
                    <tr>
                        <th scope="col">Mês</th>
                        <th scope="col">Faturamento</th>
                    </tr>
                </thead>
                <tbody>
                    {bars.map((bar) => (
                        <tr key={bar.month}>
                            <th scope="row">{bar.label}</th>
                            <td>{formatMoney(bar.revenueCents)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    )
}
