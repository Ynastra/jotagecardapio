import { useState } from 'react'

import {
    ALLERGEN_TAG_LABELS,
    HIGHLIGHT_TAG_LABELS,
    INFO_TAG_LABELS,
    PORTION_UNIT_LABELS,
    type PortionUnit,
} from '@/entities/product'
import { Button } from '@/shared/ui'

import { DESCRIPTION_MAX, type ProductDraft, type ProductFormErrors } from '../model/product-form'
import styles from './product-edit.module.css'
import { TagsSheet } from './TagsSheet'

type DetailsSectionProps = {
    draft: ProductDraft
    errors: ProductFormErrors['fields']
    onChange: (patch: Partial<ProductDraft>) => void
}

function listSelectedTagLabels(draft: ProductDraft): string[] {
    const labels = [
        ...(draft.highlightTag ? [HIGHLIGHT_TAG_LABELS[draft.highlightTag]] : []),
        ...draft.infoTags.map((tag) => INFO_TAG_LABELS[tag]),
        ...draft.allergenTags.map((tag) => ALLERGEN_TAG_LABELS[tag]),
    ]
    return labels
}

export function DetailsSection({ draft, errors, onChange }: DetailsSectionProps) {
    const [isEditingTags, setEditingTags] = useState(false)
    const tagLabels = listSelectedTagLabels(draft)

    return (
        <section className={styles.section} aria-label="Detalhes do produto">
            <h2 className={styles.sectionTitle}>Detalhes</h2>

            <div className={styles.fieldRow}>
                <label className={styles.field}>
                    Medida
                    <input
                        inputMode="decimal"
                        placeholder="Quantidade"
                        value={draft.portionText}
                        aria-invalid={errors.portionText !== undefined}
                        onChange={(event) => onChange({ portionText: event.target.value })}
                    />
                    {errors.portionText ? <span className={styles.fieldError}>{errors.portionText}</span> : null}
                </label>
                <label className={styles.field}>
                    Unidade
                    <select
                        value={draft.portionUnit}
                        aria-invalid={errors.portionUnit !== undefined}
                        onChange={(event) => onChange({ portionUnit: event.target.value as PortionUnit | '' })}
                    >
                        <option value="">Sem medida</option>
                        {(Object.keys(PORTION_UNIT_LABELS) as PortionUnit[]).map((unit) => (
                            <option key={unit} value={unit}>
                                {PORTION_UNIT_LABELS[unit]}
                            </option>
                        ))}
                    </select>
                    {errors.portionUnit ? <span className={styles.fieldError}>{errors.portionUnit}</span> : null}
                </label>
            </div>

            <div className={styles.fieldRow}>
                <label className={styles.field}>
                    Serve quantas pessoas
                    <input
                        inputMode="numeric"
                        placeholder="Opcional"
                        value={draft.servesText}
                        aria-invalid={errors.servesText !== undefined}
                        onChange={(event) => onChange({ servesText: event.target.value })}
                    />
                    {errors.servesText ? <span className={styles.fieldError}>{errors.servesText}</span> : null}
                </label>
                <label className={styles.field}>
                    Estoque
                    <input
                        inputMode="numeric"
                        placeholder="Sem controle"
                        value={draft.stockText}
                        aria-invalid={errors.stockText !== undefined}
                        onChange={(event) => onChange({ stockText: event.target.value })}
                    />
                    {errors.stockText ? <span className={styles.fieldError}>{errors.stockText}</span> : null}
                </label>
            </div>

            <label className={styles.field}>
                Descrição
                <textarea
                    rows={4}
                    value={draft.description}
                    maxLength={DESCRIPTION_MAX}
                    aria-invalid={errors.description !== undefined}
                    onChange={(event) => onChange({ description: event.target.value })}
                />
                <span className={styles.hint}>
                    {draft.description.length}/{DESCRIPTION_MAX}
                </span>
                {errors.description ? <span className={styles.fieldError}>{errors.description}</span> : null}
            </label>

            <div className={styles.field}>
                Etiquetas
                {tagLabels.length > 0 ? (
                    <ul className={styles.chips}>
                        {tagLabels.map((label) => (
                            <li key={label} className={styles.chip}>
                                {label}
                            </li>
                        ))}
                    </ul>
                ) : null}
                <div>
                    <Button variant="secondary" onClick={() => setEditingTags(true)}>
                        Editar etiquetas
                    </Button>
                </div>
            </div>

            <fieldset className={styles.tagGroup}>
                <legend className={styles.tagGroupTitle}>Onde vender</legend>
                <label className={styles.tagOption}>
                    <input
                        type="checkbox"
                        checked={draft.sellsDeliveryPickup}
                        onChange={(event) => onChange({ sellsDeliveryPickup: event.target.checked })}
                    />
                    Entrega e retirada
                </label>
                <label className={styles.tagOption}>
                    <input
                        type="checkbox"
                        checked={draft.sellsTable}
                        onChange={(event) => onChange({ sellsTable: event.target.checked })}
                    />
                    Mesa e balcão
                </label>
            </fieldset>

            {isEditingTags ? (
                <TagsSheet
                    selection={{
                        highlightTag: draft.highlightTag,
                        infoTags: draft.infoTags,
                        allergenTags: draft.allergenTags,
                    }}
                    onApply={onChange}
                    onClose={() => setEditingTags(false)}
                />
            ) : null}
        </section>
    )
}
