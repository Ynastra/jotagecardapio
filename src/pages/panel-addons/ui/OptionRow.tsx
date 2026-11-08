import { ActionMenu, ActiveSwitch, ThemeImage } from '@/shared/ui'

import type { AddonOption } from '../model/addon-group'
import { InlinePriceField } from './InlinePriceField'
import styles from './addons.module.css'

type OptionRowProps = {
    option: AddonOption
    isFirst: boolean
    isLast: boolean
    onChangePrice: (optionId: string, priceCents: number) => Promise<boolean>
    onToggle: (optionId: string, active: boolean) => void
    onEdit: (option: AddonOption) => void
    onMove: (option: AddonOption, direction: 'up' | 'down') => void
    onDelete: (option: AddonOption) => void
}

export function OptionRow({ option, isFirst, isLast, onChangePrice, onToggle, onEdit, onMove, onDelete }: OptionRowProps) {
    const rowClass = option.active ? styles.option : `${styles.option} ${styles.optionInactive}`

    return (
        <li className={rowClass}>
            <ThemeImage className={styles.optionPhoto} src={option.imageUrl} fallbackStem="produto-sem-foto" alt="" />
            <div className={styles.optionText}>
                <span className={styles.optionName}>{option.name}</span>
                {option.description ? <span className={styles.optionDescription}>{option.description}</span> : null}
            </div>
            <div className={styles.optionControls}>
                <InlinePriceField
                    label={`Preço de ${option.name}`}
                    priceCents={option.priceCents}
                    onCommit={(priceCents) => onChangePrice(option.id, priceCents)}
                />
                <ActiveSwitch
                    label={`${option.name} ativo`}
                    checked={option.active}
                    onChange={(checked) => onToggle(option.id, checked)}
                />
                <ActionMenu
                    label={`Ações de ${option.name}`}
                    actions={[
                        { label: 'Editar', onSelect: () => onEdit(option) },
                        { label: 'Subir', onSelect: () => onMove(option, 'up'), disabled: isFirst },
                        { label: 'Descer', onSelect: () => onMove(option, 'down'), disabled: isLast },
                        { label: 'Excluir', onSelect: () => onDelete(option), isDanger: true },
                    ]}
                />
            </div>
        </li>
    )
}
