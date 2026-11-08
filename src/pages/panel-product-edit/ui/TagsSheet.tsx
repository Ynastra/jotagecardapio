import { useState } from 'react'

import {
    ALLERGEN_TAG_LABELS,
    HIGHLIGHT_TAG_LABELS,
    INFO_TAG_LABELS,
    type AllergenTag,
    type HighlightTag,
    type InfoTag,
} from '@/entities/product'
import { Button, Sheet } from '@/shared/ui'

import styles from './product-edit.module.css'

export type TagSelection = {
    highlightTag: HighlightTag | null
    infoTags: InfoTag[]
    allergenTags: AllergenTag[]
}

type TagsSheetProps = {
    selection: TagSelection
    onApply: (selection: TagSelection) => void
    onClose: () => void
}

function toggleTag<Tag extends string>(tags: readonly Tag[], tag: Tag, checked: boolean): Tag[] {
    const others = tags.filter((candidate) => candidate !== tag)
    const next = checked ? [...others, tag] : others
    return next
}

export function TagsSheet({ selection, onApply, onClose }: TagsSheetProps) {
    const [draft, setDraft] = useState(selection)

    function apply() {
        onApply(draft)
        onClose()
    }

    const footer = (
        <div className={styles.sheetFooter}>
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button onClick={apply}>Aplicar</Button>
        </div>
    )

    return (
        <Sheet title="Etiquetas" onClose={onClose} footer={footer}>
            <div className={styles.sheetForm}>
                <fieldset className={styles.tagGroup}>
                    <legend className={styles.tagGroupTitle}>Destaque</legend>
                    <label className={styles.tagOption}>
                        <input
                            type="radio"
                            name="destaque"
                            checked={draft.highlightTag === null}
                            onChange={() => setDraft({ ...draft, highlightTag: null })}
                        />
                        Nenhum
                    </label>
                    {(Object.keys(HIGHLIGHT_TAG_LABELS) as HighlightTag[]).map((tag) => (
                        <label key={tag} className={styles.tagOption}>
                            <input
                                type="radio"
                                name="destaque"
                                checked={draft.highlightTag === tag}
                                onChange={() => setDraft({ ...draft, highlightTag: tag })}
                            />
                            {HIGHLIGHT_TAG_LABELS[tag]}
                        </label>
                    ))}
                </fieldset>

                <fieldset className={styles.tagGroup}>
                    <legend className={styles.tagGroupTitle}>Informações</legend>
                    {(Object.keys(INFO_TAG_LABELS) as InfoTag[]).map((tag) => (
                        <label key={tag} className={styles.tagOption}>
                            <input
                                type="checkbox"
                                checked={draft.infoTags.includes(tag)}
                                onChange={(event) =>
                                    setDraft({ ...draft, infoTags: toggleTag(draft.infoTags, tag, event.target.checked) })
                                }
                            />
                            {INFO_TAG_LABELS[tag]}
                        </label>
                    ))}
                </fieldset>

                <fieldset className={styles.tagGroup}>
                    <legend className={styles.tagGroupTitle}>Alergias</legend>
                    {(Object.keys(ALLERGEN_TAG_LABELS) as AllergenTag[]).map((tag) => (
                        <label key={tag} className={styles.tagOption}>
                            <input
                                type="checkbox"
                                checked={draft.allergenTags.includes(tag)}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        allergenTags: toggleTag(draft.allergenTags, tag, event.target.checked),
                                    })
                                }
                            />
                            {ALLERGEN_TAG_LABELS[tag]}
                        </label>
                    ))}
                </fieldset>
            </div>
        </Sheet>
    )
}
