import { useState } from 'react'

import { Button, Sheet } from '@/shared/ui'

import type { AddonGroupSummary } from '../api/fetch-addon-groups'
import styles from './product-edit.module.css'

type AddonPickerSheetProps = {
    candidates: readonly AddonGroupSummary[]
    onApply: (groupIds: string[]) => void
    onClose: () => void
}

export function AddonPickerSheet({ candidates, onApply, onClose }: AddonPickerSheetProps) {
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

    function toggle(groupId: string, checked: boolean) {
        const next = new Set(selected)
        if (checked) {
            next.add(groupId)
        } else {
            next.delete(groupId)
        }
        setSelected(next)
    }

    function apply() {
        onApply([...selected])
        onClose()
    }

    const footer = (
        <div className={styles.sheetFooter}>
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button disabled={selected.size === 0} onClick={apply}>
                Vincular
            </Button>
        </div>
    )

    return (
        <Sheet title="Selecionar adicionais" onClose={onClose} footer={footer}>
            {candidates.length === 0 ? (
                <p className={styles.confirmText}>Todos os grupos da loja já estão neste produto.</p>
            ) : (
                <ul className={styles.links}>
                    {candidates.map((group) => (
                        <li key={group.id}>
                            <label className={styles.tagOption}>
                                <input
                                    type="checkbox"
                                    checked={selected.has(group.id)}
                                    onChange={(event) => toggle(group.id, event.target.checked)}
                                />
                                {group.title} ({group.optionCount} {group.optionCount === 1 ? 'item' : 'itens'})
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </Sheet>
    )
}
