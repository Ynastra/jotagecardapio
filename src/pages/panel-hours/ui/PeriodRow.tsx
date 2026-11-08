import { ActionMenu } from '@/shared/ui'

import { describePeriodTime, WEEKDAY_SHORT_NAMES, type Period } from '../model/hours'
import styles from './hours.module.css'

type PeriodRowProps = {
    period: Period
    onEdit: (period: Period) => void
    onDelete: (period: Period) => void
}

export function PeriodRow({ period, onEdit, onDelete }: PeriodRowProps) {
    const timeText = describePeriodTime(period)

    return (
        <li className={styles.period}>
            <div className={styles.periodInfo}>
                <span className={styles.periodTime}>{timeText}</span>
                <ul className={styles.days} aria-label="Dias do período">
                    {period.weekdays.map((weekday) => (
                        <li key={weekday} className={styles.dayChip}>
                            {WEEKDAY_SHORT_NAMES[weekday]}
                        </li>
                    ))}
                </ul>
            </div>
            <ActionMenu
                label={`Ações do horário ${timeText}`}
                actions={[
                    { label: 'Editar', onSelect: () => onEdit(period) },
                    { label: 'Excluir', onSelect: () => onDelete(period), isDanger: true },
                ]}
            />
        </li>
    )
}
