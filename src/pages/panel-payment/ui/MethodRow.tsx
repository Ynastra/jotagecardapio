import { PAYMENT_LABELS } from '@/entities/order'

import type { FeeKind, MethodForm } from '../model/payment-form'
import styles from './payment.module.css'

type MethodRowProps = {
    rule: MethodForm
    error: string | undefined
    onChange: (patch: Partial<MethodForm>) => void
}

export function MethodRow({ rule, error, onChange }: MethodRowProps) {
    const label = PAYMENT_LABELS[rule.method]
    const isPercent = rule.feeKind === 'percent'

    return (
        <li className={styles.method}>
            <span className={styles.methodName}>{label}</span>
            <div className={styles.methodControls}>
                <label className={styles.toggleLabel}>
                    <input
                        type="checkbox"
                        checked={rule.enabledDelivery}
                        onChange={(event) => onChange({ enabledDelivery: event.target.checked })}
                    />
                    <span>
                        Entrega<span className="visually-hidden"> com {label}</span>
                    </span>
                </label>
                <label className={styles.toggleLabel}>
                    <input
                        type="checkbox"
                        checked={rule.enabledPickup}
                        onChange={(event) => onChange({ enabledPickup: event.target.checked })}
                    />
                    <span>
                        Retirada<span className="visually-hidden"> com {label}</span>
                    </span>
                </label>
                <div className={styles.feeRow}>
                    <select
                        aria-label={`Tipo da taxa extra de ${label}`}
                        value={rule.feeKind}
                        onChange={(event) => onChange({ feeKind: event.target.value as FeeKind })}
                    >
                        <option value="fixed">Taxa extra em R$</option>
                        <option value="percent">Taxa extra em %</option>
                    </select>
                    <input
                        className={styles.feeInput}
                        inputMode="decimal"
                        placeholder={isPercent ? '0 %' : '0,00'}
                        aria-label={`Taxa extra de ${label}`}
                        aria-invalid={error !== undefined}
                        value={isPercent ? rule.feePercentText : rule.feeFixedText}
                        onChange={(event) =>
                            onChange(
                                isPercent ? { feePercentText: event.target.value } : { feeFixedText: event.target.value },
                            )
                        }
                    />
                </div>
            </div>
            {error ? <span className={styles.fieldError}>{error}</span> : null}
        </li>
    )
}
