import { useState, type FormEvent } from 'react'

import { Button, Sheet } from '@/shared/ui'

import styles from './product-edit.module.css'

const FORM_ID = 'formulario-categoria'

type CategorySheetProps = {
    onSave: (name: string) => Promise<boolean>
    onClose: () => void
}

export function CategorySheet({ onSave, onClose }: CategorySheetProps) {
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setSaving] = useState(false)

    async function submit(event: FormEvent) {
        event.preventDefault()
        const trimmed = name.trim()
        if (trimmed === '') {
            setError('Informe o nome da categoria')
            return
        }

        setSaving(true)
        const saved = await onSave(trimmed)
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
                Criar categoria
            </Button>
        </div>
    )

    return (
        <Sheet title="Nova categoria" onClose={onClose} footer={footer}>
            <form id={FORM_ID} className={styles.sheetForm} onSubmit={submit} noValidate>
                <label className={styles.field}>
                    Nome
                    <input
                        value={name}
                        aria-invalid={error !== null}
                        autoFocus
                        onChange={(event) => setName(event.target.value)}
                    />
                    {error ? <span className={styles.fieldError}>{error}</span> : null}
                </label>
            </form>
        </Sheet>
    )
}
