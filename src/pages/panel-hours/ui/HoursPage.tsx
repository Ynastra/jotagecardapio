import { useEffect, useState } from 'react'

import { useCurrentStore } from '@/entities/store'
import { Button, ConfirmSheet } from '@/shared/ui'

import { describePeriodTime, describeTimezone, type Period } from '../model/hours'
import { useHours } from '../model/use-hours'
import styles from './hours.module.css'
import { PeriodRow } from './PeriodRow'
import { PeriodSheet } from './PeriodSheet'

type SheetState = { kind: 'edit'; period: Period | null } | { kind: 'delete'; period: Period }

export function HoursPage() {
    const store = useCurrentStore()
    const hours = useHours(store.id)
    const [sheet, setSheet] = useState<SheetState | null>(null)
    const [isDeleting, setDeleting] = useState(false)
    const hasNoPeriods = !hours.isLoading && hours.periods.length === 0

    useEffect(() => {
        document.title = `Horários · ${store.name}`
    }, [store.name])

    function closeSheet() {
        setSheet(null)
    }

    async function confirmDelete() {
        if (sheet?.kind !== 'delete') {
            return
        }

        setDeleting(true)
        const removed = await hours.removePeriod(sheet.period)
        setDeleting(false)
        if (removed) {
            closeSheet()
        }
    }

    function renderSheet() {
        if (!sheet) {
            return null
        }

        if (sheet.kind === 'edit') {
            const { period } = sheet
            const others = hours.periods.filter((candidate) => candidate.key !== period?.key)
            return (
                <PeriodSheet
                    period={period}
                    otherPeriods={others}
                    onSave={(draft) => hours.savePeriod(period, draft)}
                    onClose={closeSheet}
                />
            )
        }

        return (
            <ConfirmSheet
                title={`Excluir ${describePeriodTime(sheet.period)}`}
                message="O horário some dos dias do período. Sem horários, a loja não recebe pedidos."
                confirmLabel="Excluir horário"
                isPending={isDeleting}
                onConfirm={confirmDelete}
                onClose={closeSheet}
            />
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Horários</h1>
                    <p className={styles.timezone}>{describeTimezone(store.timezone)}</p>
                </div>
                <Button onClick={() => setSheet({ kind: 'edit', period: null })}>+ Novo horário</Button>
            </div>

            {hours.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{hours.errorMessage}</p>
                    <Button variant="ghost" onClick={hours.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}
            {hours.isLoading ? <p className={styles.muted}>Carregando horários</p> : null}
            {hasNoPeriods ? <p className={styles.empty}>Sem horários, a loja não recebe pedidos.</p> : null}

            <ul className={styles.list}>
                {hours.periods.map((period) => (
                    <PeriodRow
                        key={period.key}
                        period={period}
                        onEdit={(target) => setSheet({ kind: 'edit', period: target })}
                        onDelete={(target) => setSheet({ kind: 'delete', period: target })}
                    />
                ))}
            </ul>

            {renderSheet()}
        </div>
    )
}
