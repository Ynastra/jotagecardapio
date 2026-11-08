import { useState } from 'react'

import { Button } from '@/shared/ui'

import type { AddonGroupSummary } from '../api/fetch-addon-groups'
import { isLinkRequired, type LinkDraft, type ProductFormErrors } from '../model/product-form'
import type { ProductEditor } from '../model/use-product-editor'
import { AddonPickerSheet } from './AddonPickerSheet'
import styles from './product-edit.module.css'

type AddonLinksSectionProps = {
    links: readonly LinkDraft[]
    groups: readonly AddonGroupSummary[]
    errors: ProductFormErrors['links']
    editor: Pick<ProductEditor, 'addLinks' | 'removeLink' | 'moveLink' | 'changeLink' | 'toggleLinkRequired'>
}

export function AddonLinksSection({ links, groups, errors, editor }: AddonLinksSectionProps) {
    const [isPicking, setPicking] = useState(false)
    const groupsById = new Map(groups.map((group) => [group.id, group]))
    const linkedIds = new Set(links.map((link) => link.groupId))
    const candidates = groups.filter((group) => !linkedIds.has(group.id))

    return (
        <section id="secao-adicionais" className={styles.section} aria-label="Adicionais do produto">
            <h2 className={styles.sectionTitle}>Adicionais</h2>

            {links.length === 0 ? <p className={styles.hint}>Nenhum grupo de adicionais neste produto.</p> : null}

            <ul className={styles.links}>
                {links.map((link, index) => {
                    const group = groupsById.get(link.groupId)
                    const title = group?.title ?? 'Grupo removido'
                    const linkErrors = errors[link.groupId] ?? {}
                    return (
                        <li key={link.groupId} className={styles.link}>
                            <div className={styles.linkHead}>
                                <span className={styles.linkName}>
                                    {title}
                                    {group && !group.active ? ' (desativado)' : ''}
                                </span>
                                <div className={styles.linkActions}>
                                    <Button
                                        variant="ghost"
                                        disabled={index === 0}
                                        onClick={() => editor.moveLink(link.groupId, 'up')}
                                    >
                                        Subir
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        disabled={index === links.length - 1}
                                        onClick={() => editor.moveLink(link.groupId, 'down')}
                                    >
                                        Descer
                                    </Button>
                                    <Button variant="ghost" onClick={() => editor.removeLink(link.groupId)}>
                                        Remover
                                    </Button>
                                </div>
                            </div>

                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    role="switch"
                                    checked={isLinkRequired(link)}
                                    onChange={(event) => editor.toggleLinkRequired(link.groupId, event.target.checked)}
                                />
                                Seleção obrigatória
                            </label>

                            <div className={styles.fieldRow}>
                                <label className={styles.field}>
                                    Mínimo
                                    <input
                                        inputMode="numeric"
                                        value={link.minText}
                                        aria-invalid={linkErrors.minText !== undefined}
                                        onChange={(event) => editor.changeLink(link.groupId, { minText: event.target.value })}
                                    />
                                    {linkErrors.minText ? <span className={styles.fieldError}>{linkErrors.minText}</span> : null}
                                </label>
                                <label className={styles.field}>
                                    Máximo
                                    <input
                                        inputMode="numeric"
                                        placeholder="Sem limite"
                                        value={link.maxText}
                                        aria-invalid={linkErrors.maxText !== undefined}
                                        onChange={(event) => editor.changeLink(link.groupId, { maxText: event.target.value })}
                                    />
                                    {linkErrors.maxText ? <span className={styles.fieldError}>{linkErrors.maxText}</span> : null}
                                </label>
                            </div>
                        </li>
                    )
                })}
            </ul>

            <div>
                <Button variant="secondary" onClick={() => setPicking(true)}>
                    Selecionar adicionais
                </Button>
            </div>

            {isPicking ? (
                <AddonPickerSheet
                    candidates={candidates}
                    onApply={editor.addLinks}
                    onClose={() => setPicking(false)}
                />
            ) : null}
        </section>
    )
}
