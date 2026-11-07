import { formatCents } from '@/shared/lib'
import { QuantityStepper, ThemeIcon } from '@/shared/ui'

import {
    describeGroupRule,
    getGroupInputKind,
    getOptionCeiling,
    isGroupSatisfied,
    setOptionQuantity,
    type OptionSelection,
} from '../model/pricing'
import type { OptionGroup, ProductOption } from '../model/types'
import styles from './option-group-field.module.css'

type OptionGroupFieldProps = {
    group: OptionGroup
    selection: OptionSelection
    // Recebe uma função sobre a seleção atual, para dois toques seguidos não
    // gravarem um por cima do outro com a seleção antiga.
    onChange: (update: (current: OptionSelection) => OptionSelection) => void
    showErrors: boolean
}

function OptionLabel({ option }: { option: ProductOption }) {
    return (
        <span className={styles.optionText}>
            <span className={styles.optionName}>{option.name}</span>
            {option.description ? <span className={styles.optionDescription}>{option.description}</span> : null}
            {option.priceCents > 0 ? <span className={styles.optionPrice}>+{formatCents(option.priceCents)}</span> : null}
        </span>
    )
}

export function OptionGroupField({ group, selection, onChange, showErrors }: OptionGroupFieldProps) {
    const kind = getGroupInputKind(group)
    const isRequired = group.minChoices > 0
    const isSatisfied = isGroupSatisfied(group, selection)
    const isMissing = showErrors && !isSatisfied
    // Grupo de escolha única obrigatório vira rádio; opcional vira caixa, que dá
    // para desmarcar.
    const singleInputType = isRequired ? 'radio' : 'checkbox'

    function changeQuantity(option: ProductOption, quantity: number) {
        onChange((current) => setOptionQuantity(group, option, quantity, current))
    }

    return (
        <fieldset id={`grupo-${group.id}`} className={styles.group}>
            <legend className={styles.legend}>
                <span className={styles.title}>{group.title}</span>
                <span className={styles.rule}>
                    {describeGroupRule(group)}
                    {isRequired && !isSatisfied ? (
                        <span className={isMissing ? `${styles.badge} ${styles.badgeMissing}` : styles.badge}>Obrigatório</span>
                    ) : null}
                    {isRequired && isSatisfied ? (
                        <span className={`${styles.badge} ${styles.badgeDone}`}>
                            <ThemeIcon name="check" size={14} label="Escolhido" />
                        </span>
                    ) : null}
                </span>
            </legend>

            <ul className={styles.options}>
                {group.options.map((option) => {
                    const quantity = selection[option.id] ?? 0
                    const ceiling = getOptionCeiling(group, option, selection)

                    if (kind === 'quantity') {
                        return (
                            <li key={option.id} className={styles.option}>
                                <OptionLabel option={option} />
                                <QuantityStepper
                                    compact
                                    label={option.name}
                                    value={quantity}
                                    max={ceiling}
                                    onChange={(next) => changeQuantity(option, next)}
                                />
                            </li>
                        )
                    }

                    const inputType = kind === 'single' ? singleInputType : 'checkbox'
                    const isChecked = quantity > 0
                    const isBlocked = kind === 'multiple' && !isChecked && ceiling === 0

                    return (
                        <li key={option.id}>
                            <label className={isBlocked ? `${styles.option} ${styles.blocked}` : styles.option}>
                                <OptionLabel option={option} />
                                <input
                                    type={inputType}
                                    name={group.id}
                                    checked={isChecked}
                                    disabled={isBlocked}
                                    onChange={() => changeQuantity(option, isChecked ? 0 : 1)}
                                />
                            </label>
                        </li>
                    )
                })}
            </ul>
        </fieldset>
    )
}
