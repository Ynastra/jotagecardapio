import { useState, type FormEvent } from 'react'

import { Button, Sheet } from '@/shared/ui'

import {
    validatePeriodDraft,
    WEEKDAYS,
    WEEKDAY_SHORT_NAMES,
    type Period,
    type PeriodDraft,
    type PeriodErrors,
} from '../model/hours'
import styles from './hours.module.css'

const FORM_ID = 'formulario-horario'

type PeriodSheetProps = {
    period: Period | null
    otherPeriods: readonly Period[]
    onSave: (draft: PeriodDraft) => Promise<boolean>
    onClose: () => void
}

export function PeriodSheet({ period, otherPeriods, onSave, onClose }: PeriodSheetProps) {
    const [weekdays, setWeekdays] = useState<number[]>(period?.weekdays ?? [])
    const [opensAt, setOpensAt] = useState(period?.opensAt ?? '')
    const [closesAt, setClosesAt] = useState(period?.closesAt ?? '')
    const [errors, setErrors] = useState<PeriodErrors>({})
    const [isSaving, setSaving] = useState(false)

    function toggleWeekday(weekday: number) {
        setWeekdays((current) =>
            current.includes(weekday) ? current.filter((day) => day !== weekday) : [...current, weekday],
        )
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const draft = { weekdays: [...weekdays].sort((first, second) => first - second), opensAt, closesAt }
        const found = validatePeriodDraft(draft, otherPeriods)
        setErrors(found)
        if (Object.keys(found).length > 0) {
            return
        }

        setSaving(true)
        const saved = await onSave(draft)
        setSaving(false)
        if (saved) {
            onClose()
        }
    }

    const footer = (
        <div className={styles.sheetFooter}>
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} disabled={isSaving}>
                Salvar
            </Button>
        </div>
    )

    return (
        <Sheet title={period ? 'Editar horário' : 'Novo horário'} onClose={onClose} footer={footer}>
            <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
                <fieldset className={styles.fieldGroup}>
                    <legend className={styles.fieldGroupTitle}>Dias</legend>
                    <div className={styles.dayPicker}>
                        {WEEKDAYS.map((weekday) => {
                            const isOn = weekdays.includes(weekday)
                            return (
                                <button
                                    key={weekday}
                                    type="button"
                                    aria-pressed={isOn}
                                    className={isOn ? `${styles.dayToggle} ${styles.dayToggleOn}` : styles.dayToggle}
                                    onClick={() => toggleWeekday(weekday)}
                                >
                                    {WEEKDAY_SHORT_NAMES[weekday]}
                                </button>
                            )
                        })}
                    </div>
                    {errors.weekdays ? <span className={styles.fieldError}>{errors.weekdays}</span> : null}
                </fieldset>

                <div className={styles.timeRow}>
                    <label className={styles.field}>
                        Início
                        <input
                            type="time"
                            value={opensAt}
                            aria-invalid={errors.time !== undefined}
                            onChange={(event) => setOpensAt(event.target.value)}
                        />
                    </label>
                    <label className={styles.field}>
                        Fim
                        <input
                            type="time"
                            value={closesAt}
                            aria-invalid={errors.time !== undefined}
                            onChange={(event) => setClosesAt(event.target.value)}
                        />
                    </label>
                </div>
                {errors.time ? <span className={styles.fieldError}>{errors.time}</span> : null}
            </form>
        </Sheet>
    )
}
