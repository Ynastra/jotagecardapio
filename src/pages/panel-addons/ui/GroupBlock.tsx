import { ActionMenu, ActiveSwitch, Button } from '@/shared/ui'

import { describeUsage, type AddonGroup, type AddonOption } from '../model/addon-group'
import type { MoveDirection } from '../model/ordering'
import { OptionRow } from './OptionRow'
import styles from './addons.module.css'

type GroupBlockProps = {
    group: AddonGroup
    isFirst: boolean
    isLast: boolean
    onToggle: (groupId: string, active: boolean) => void
    onEdit: (group: AddonGroup) => void
    onMove: (group: AddonGroup, direction: MoveDirection) => void
    onDelete: (group: AddonGroup) => void
    onNewOption: (group: AddonGroup) => void
    onChangeOptionPrice: (optionId: string, priceCents: number) => Promise<boolean>
    onToggleOption: (optionId: string, active: boolean) => void
    onEditOption: (option: AddonOption) => void
    onMoveOption: (option: AddonOption, direction: MoveDirection) => void
    onDeleteOption: (option: AddonOption) => void
}

export function GroupBlock({
    group,
    isFirst,
    isLast,
    onToggle,
    onEdit,
    onMove,
    onDelete,
    onNewOption,
    onChangeOptionPrice,
    onToggleOption,
    onEditOption,
    onMoveOption,
    onDeleteOption,
}: GroupBlockProps) {
    const usage = describeUsage(group.productCount)

    return (
        <section id={`grupo-${group.id}`} className={styles.group} aria-label={group.title}>
            <div className={styles.groupHead}>
                <div className={styles.groupText}>
                    <h2 className={styles.groupTitle}>{group.title}</h2>
                    {group.description ? <p className={styles.groupDescription}>{group.description}</p> : null}
                    {usage ? <p className={styles.usage}>{usage}</p> : null}
                </div>
                <div className={styles.groupActions}>
                    <ActiveSwitch
                        label={`${group.title} ativo`}
                        checked={group.active}
                        onChange={(checked) => onToggle(group.id, checked)}
                    />
                    <Button variant="secondary" onClick={() => onNewOption(group)}>
                        + Novo item
                    </Button>
                    <ActionMenu
                        label={`Ações de ${group.title}`}
                        actions={[
                            { label: 'Editar', onSelect: () => onEdit(group) },
                            { label: 'Subir', onSelect: () => onMove(group, 'up'), disabled: isFirst },
                            { label: 'Descer', onSelect: () => onMove(group, 'down'), disabled: isLast },
                            { label: 'Excluir', onSelect: () => onDelete(group), isDanger: true },
                        ]}
                    />
                </div>
            </div>

            <ul className={styles.options}>
                {group.options.map((option, index) => (
                    <OptionRow
                        key={option.id}
                        option={option}
                        isFirst={index === 0}
                        isLast={index === group.options.length - 1}
                        onChangePrice={onChangeOptionPrice}
                        onToggle={onToggleOption}
                        onEdit={onEditOption}
                        onMove={onMoveOption}
                        onDelete={onDeleteOption}
                    />
                ))}
            </ul>
        </section>
    )
}
