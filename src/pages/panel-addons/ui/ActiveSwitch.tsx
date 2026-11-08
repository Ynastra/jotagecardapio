import styles from './addons.module.css'

type ActiveSwitchProps = {
    label: string
    checked: boolean
    disabled?: boolean
    onChange: (checked: boolean) => void
}

export function ActiveSwitch({ label, checked, disabled = false, onChange }: ActiveSwitchProps) {
    const stateLabel = checked ? 'Ativado' : 'Desativado'

    return (
        <label className={styles.switch}>
            <input
                type="checkbox"
                role="switch"
                aria-label={label}
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            {stateLabel}
        </label>
    )
}
