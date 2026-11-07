import { useState } from 'react'

import type { DraftLine } from '@/entities/order'
import { createLocalId, formatCents } from '@/shared/lib'
import { Button, QuantityStepper, Sheet, ThemeIcon, ThemeImage } from '@/shared/ui'

import {
    calculateUnitPriceCents,
    findUnsatisfiedGroup,
    toDraftOptions,
    type OptionSelection,
} from '../model/pricing'
import type { Product } from '../model/types'
import { OptionGroupField } from './OptionGroupField'
import styles from './product-sheet.module.css'

const MAX_ITEM_QUANTITY = 99
const MAX_NOTES_LENGTH = 140

type ProductSheetProps = {
    product: Product
    onAdd: (line: DraftLine) => void
    onClose: () => void
}

export function ProductSheet({ product, onAdd, onClose }: ProductSheetProps) {
    const [selection, setSelection] = useState<OptionSelection>({})
    const [quantity, setQuantity] = useState(1)
    const [notes, setNotes] = useState('')
    const [showErrors, setShowErrors] = useState(false)

    const unitPriceCents = calculateUnitPriceCents(product, selection)
    const unsatisfiedGroup = findUnsatisfiedGroup(product, selection)

    function handleAdd() {
        if (unsatisfiedGroup) {
            setShowErrors(true)
            document.getElementById(`grupo-${unsatisfiedGroup.id}`)?.scrollIntoView({ behavior: 'smooth' })
            return
        }

        onAdd({
            key: createLocalId(),
            productId: product.id,
            name: product.name,
            quantity,
            unitPriceCents,
            notes: notes.trim(),
            options: toDraftOptions(product, selection),
        })
    }

    const footer = (
        <div className={styles.footer}>
            <QuantityStepper label="quantidade" value={quantity} min={1} max={MAX_ITEM_QUANTITY} onChange={setQuantity} />
            <Button className={styles.addButton} onClick={handleAdd} aria-disabled={unsatisfiedGroup !== undefined}>
                <span>Adicionar</span>
                <span>{formatCents(unitPriceCents * quantity)}</span>
            </Button>
        </div>
    )

    return (
        <Sheet title={product.name} onClose={onClose} footer={footer}>
            <div className={styles.intro}>
                <ThemeImage className={styles.photo} src={product.imageUrl} fallbackStem="produto-sem-foto" alt={product.name} />
                <div className={styles.facts}>
                    {product.portionLabel ? <span className={styles.fact}>{product.portionLabel}</span> : null}
                    {product.serves ? (
                        <span className={styles.fact}>
                            <ThemeIcon name="pessoas" size={14} />
                            Serve {product.serves} {product.serves === 1 ? 'pessoa' : 'pessoas'}
                        </span>
                    ) : null}
                </div>
                {product.description ? <p className={styles.description}>{product.description}</p> : null}
            </div>

            {product.optionGroups.map((group) => (
                <OptionGroupField
                    key={group.id}
                    group={group}
                    selection={selection}
                    onChange={setSelection}
                    showErrors={showErrors}
                />
            ))}

            <label className={styles.notes}>
                <span className={styles.notesLabel}>
                    <ThemeIcon name="observacao" size={18} />
                    Alguma observação?
                </span>
                <textarea
                    rows={2}
                    maxLength={MAX_NOTES_LENGTH}
                    placeholder="Ex.: sem cebola, trocar alface por rúcula"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                />
            </label>
        </Sheet>
    )
}
