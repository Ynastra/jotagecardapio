import styles from './products.module.css'

type ActiveSwitchProps = {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}

export function ActiveSwitch({ label, checked, onChange }: ActiveSwitchProps) {
    const stateLabel = checked ? 'Ativado' : 'Desativado'

    return (
        <label className={styles.switch}>
            <input
                type="checkbox"
                role="switch"
                aria-label={label}
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
            {stateLabel}
        </label>
    )
}
