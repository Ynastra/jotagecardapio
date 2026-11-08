import { useState, type FormEvent } from 'react'

import { Button, Sheet } from '@/shared/ui'

import { GROUP_DESCRIPTION_MAX, GROUP_TITLE_MAX, type AddonGroup } from '../model/addon-group'
import { validateGroupDraft, type GroupFormErrors, type GroupValue } from '../model/addon-form'
import styles from './addons.module.css'

type GroupSheetProps = {
    group: AddonGroup | null
    onSave: (value: GroupValue) => Promise<boolean>
    onClose: () => void
}

const FORM_ID = 'formulario-grupo'

export function GroupSheet({ group, onSave, onClose }: GroupSheetProps) {
    const [title, setTitle] = useState(group?.title ?? '')
    const [description, setDescription] = useState(group?.description ?? '')
    const [errors, setErrors] = useState<GroupFormErrors>({})
    const [isSaving, setSaving] = useState(false)

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const result = validateGroupDraft({ title, description })
        setErrors(result.errors)
        if (!result.value) {
            return
        }

        setSaving(true)
        const saved = await onSave(result.value)
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
        <Sheet title={group ? 'Editar grupo' : 'Novo grupo'} onClose={onClose} footer={footer}>
            <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit} noValidate>
                <label className={styles.field}>
                    Título
                    <input value={title} maxLength={GROUP_TITLE_MAX} onChange={(event) => setTitle(event.target.value)} />
                    {errors.title ? <span className={styles.fieldError}>{errors.title}</span> : null}
                </label>
                <label className={styles.field}>
                    Descrição
                    <textarea
                        rows={3}
                        value={description}
                        maxLength={GROUP_DESCRIPTION_MAX}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                    <span className={styles.hint}>
                        {description.length}/{GROUP_DESCRIPTION_MAX}
                    </span>
                    {errors.description ? <span className={styles.fieldError}>{errors.description}</span> : null}
                </label>
            </form>
        </Sheet>
    )
}
