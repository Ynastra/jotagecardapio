import { useState, type FormEvent } from 'react'

import { Button, Sheet } from '@/shared/ui'

import type { ZoneSaveResult } from '../model/use-zones'
import { formatCentsText } from '../model/delivery-form'
import {
    NEIGHBORHOOD_MAX,
    validateZoneDraft,
    type DeliveryZone,
    type ZoneFormErrors,
    type ZoneValue,
} from '../model/zones'
import styles from './delivery.module.css'

const FORM_ID = 'formulario-bairro'
const DUPLICATE_MESSAGE = 'Já existe um bairro com esse nome.'

type ZoneSheetProps = {
    zone: DeliveryZone | null
    otherZones: readonly DeliveryZone[]
    onSave: (value: ZoneValue) => Promise<ZoneSaveResult>
    onClose: () => void
}

export function ZoneSheet({ zone, otherZones, onSave, onClose }: ZoneSheetProps) {
    const [neighborhood, setNeighborhood] = useState(zone?.neighborhood ?? '')
    const [feeText, setFeeText] = useState(zone ? formatCentsText(zone.feeCents) : '')
    const [errors, setErrors] = useState<ZoneFormErrors>({})
    const [isSaving, setSaving] = useState(false)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const result = validateZoneDraft({ neighborhood, feeText }, otherZones)
        setErrors(result.errors)
        if (!result.value) {
            return
        }

        setSaving(true)
        const saveResult = await onSave(result.value)
        setSaving(false)

        if (saveResult === 'duplicate') {
            setErrors({ neighborhood: DUPLICATE_MESSAGE })
            return
        }
        if (saveResult === 'saved') {
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
        <Sheet title={zone ? 'Editar bairro' : 'Novo bairro'} onClose={onClose} footer={footer}>
            <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
                <label className={styles.field}>
                    Nome
                    <input
                        value={neighborhood}
                        maxLength={NEIGHBORHOOD_MAX}
                        aria-invalid={errors.neighborhood !== undefined}
                        onChange={(event) => setNeighborhood(event.target.value)}
                    />
                    {errors.neighborhood ? <span className={styles.fieldError}>{errors.neighborhood}</span> : null}
                </label>
                <label className={styles.field}>
                    Taxa de entrega (R$)
                    <input
                        inputMode="decimal"
                        placeholder="0,00"
                        value={feeText}
                        aria-invalid={errors.feeText !== undefined}
                        onChange={(event) => setFeeText(event.target.value)}
                    />
                    {errors.feeText ? <span className={styles.fieldError}>{errors.feeText}</span> : null}
                </label>
            </form>
        </Sheet>
    )
}
