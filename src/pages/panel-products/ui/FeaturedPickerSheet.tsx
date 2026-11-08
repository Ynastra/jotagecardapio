import { useState } from 'react'

import type { ManagedProduct } from '@/entities/product'
import { Button, Sheet } from '@/shared/ui'

import styles from './products.module.css'

type FeaturedPickerSheetProps = {
    candidates: readonly ManagedProduct[]
    onSave: (productIds: string[]) => Promise<boolean>
    onClose: () => void
}

export function FeaturedPickerSheet({ candidates, onSave, onClose }: FeaturedPickerSheetProps) {
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
    const [isSaving, setSaving] = useState(false)

    function toggle(productId: string, checked: boolean) {
        const next = new Set(selected)
        if (checked) {
            next.add(productId)
        } else {
            next.delete(productId)
        }
        setSelected(next)
    }

    async function save() {
        setSaving(true)
        const saved = await onSave([...selected])
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
            <Button disabled={isSaving || selected.size === 0} onClick={save}>
                Marcar destaques
            </Button>
        </div>
    )

    return (
        <Sheet title="Selecionar destaques" onClose={onClose} footer={footer}>
            {candidates.length === 0 ? (
                <p className={styles.confirmText}>Todos os produtos já são destaque.</p>
            ) : (
                <ul className={styles.pickList}>
                    {candidates.map((product) => (
                        <li key={product.id}>
                            <label className={styles.pickItem}>
                                <input
                                    type="checkbox"
                                    checked={selected.has(product.id)}
                                    onChange={(event) => toggle(product.id, event.target.checked)}
                                />
                                {product.name}
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </Sheet>
    )
}
