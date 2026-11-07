import { ThemeIcon } from '../theme-icon'
import styles from './quantity-stepper.module.css'

type QuantityStepperProps = {
    value: number
    onChange: (next: number) => void
    label: string
    min?: number
    max?: number
    compact?: boolean
}

export function QuantityStepper({
    value,
    onChange,
    label,
    min = 0,
    max = Number.POSITIVE_INFINITY,
    compact = false,
}: QuantityStepperProps) {
    const canDecrease = value > min
    const canIncrease = value < max
    const classes = compact ? `${styles.stepper} ${styles.compact}` : styles.stepper

    return (
        <div className={classes} role="group" aria-label={label}>
            <button
                type="button"
                className={styles.step}
                onClick={() => onChange(value - 1)}
                disabled={!canDecrease}
                aria-label={`Diminuir ${label}`}
            >
                <ThemeIcon name="menos" size={18} />
            </button>
            <output className={styles.value} aria-live="polite">
                {value}
            </output>
            <button
                type="button"
                className={styles.step}
                onClick={() => onChange(value + 1)}
                disabled={!canIncrease}
                aria-label={`Aumentar ${label}`}
            >
                <ThemeIcon name="mais" size={18} />
            </button>
        </div>
    )
}
