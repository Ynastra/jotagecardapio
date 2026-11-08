import { useState, type FormEvent } from 'react'

import { Button, Sheet } from '@/shared/ui'

import styles from './products.module.css'

type CategorySheetProps = {
    initialName: string | null
    onSave: (name: string) => Promise<boolean>
    onClose: () => void
}

export function CategorySheet({ initialName, onSave, onClose }: CategorySheetProps) {
    const [name, setName] = useState(initialName ?? '')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setSaving] = useState(false)
    const isNew = initialName === null

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
            <Button type="submit" form="category-form" disabled={isSaving}>
                Salvar
            </Button>
        </div>
    )

    return (
        <Sheet title={isNew ? 'Nova categoria' : 'Renomear categoria'} onClose={onClose} footer={footer}>
            <form id="category-form" className={styles.form} onSubmit={submit} noValidate>
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
