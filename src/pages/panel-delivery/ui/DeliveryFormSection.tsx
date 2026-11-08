import { ActiveSwitch } from '@/shared/ui'

import {
    DELIVERY_MODE_LABELS,
    DELIVERY_MODES,
    MAX_RADIUS_KM,
    PREP_TIME_MAX,
    PREP_TIME_MIN,
    type DeliveryForm,
    type DeliveryFormErrors,
} from '../model/delivery-form'
import styles from './delivery.module.css'

type DeliveryFormSectionProps = {
    form: DeliveryForm
    errors: DeliveryFormErrors
    onChange: (patch: Partial<DeliveryForm>) => void
}

function FieldError({ message }: { message: string | undefined }) {
    return message ? <span className={styles.fieldError}>{message}</span> : null
}

export function DeliveryFormSection({ form, errors, onChange }: DeliveryFormSectionProps) {
    const chargesFlatFee = form.mode !== 'neighborhood'

    return (
        <section className={styles.section} aria-label="Regras de entrega">
            <h2 className={styles.sectionTitle}>Entrega</h2>

            <label className={styles.field}>
                Tempo de preparo (min)
                <input
                    inputMode="numeric"
                    value={form.prepTimeText}
                    aria-invalid={errors.prepTimeText !== undefined}
                    onChange={(event) => onChange({ prepTimeText: event.target.value })}
                />
                <span className={styles.hint}>
                    De {PREP_TIME_MIN} a {PREP_TIME_MAX} minutos.
                </span>
                <FieldError message={errors.prepTimeText} />
            </label>

            <fieldset className={styles.modes}>
                <legend className={styles.modesTitle}>Modalidade</legend>
                {DELIVERY_MODES.map((mode) => (
                    <label key={mode} className={form.mode === mode ? `${styles.mode} ${styles.modeOn}` : styles.mode}>
                        <input
                            type="radio"
                            name="modalidade-entrega"
                            checked={form.mode === mode}
                            onChange={() => onChange({ mode })}
                        />
                        {DELIVERY_MODE_LABELS[mode]}
                    </label>
                ))}
            </fieldset>
            <FieldError message={errors.mode} />

            {chargesFlatFee ? (
                <div className={styles.fieldRow}>
                    <label className={styles.field}>
                        Taxa de entrega (R$)
                        <input
                            inputMode="decimal"
                            placeholder="0,00"
                            value={form.feeText}
                            aria-invalid={errors.feeText !== undefined}
                            onChange={(event) => onChange({ feeText: event.target.value })}
                        />
                        <FieldError message={errors.feeText} />
                    </label>
                    {form.mode === 'radius' ? (
                        <label className={styles.field}>
                            Raio máximo (km)
                            <input
                                inputMode="decimal"
                                placeholder={`Até ${MAX_RADIUS_KM}`}
                                value={form.maxKmText}
                                aria-invalid={errors.maxKmText !== undefined}
                                onChange={(event) => onChange({ maxKmText: event.target.value })}
                            />
                            <FieldError message={errors.maxKmText} />
                        </label>
                    ) : null}
                </div>
            ) : (
                <p className={styles.hint}>A lista de bairros abaixo vale como área de entrega.</p>
            )}
            {form.mode === 'radius' ? (
                <p className={styles.notice}>
                    A distância ainda não é conferida automaticamente; a taxa vale para qualquer endereço.
                </p>
            ) : null}

            <div className={styles.field}>
                Frete grátis acima de
                <div className={styles.freeRow}>
                    <ActiveSwitch
                        label="Frete grátis acima de um valor"
                        checked={form.hasFreeDelivery}
                        onChange={(checked) => onChange({ hasFreeDelivery: checked })}
                    />
                    {form.hasFreeDelivery ? (
                        <input
                            inputMode="decimal"
                            placeholder="0,00"
                            aria-label="Valor do pedido para frete grátis (R$)"
                            value={form.freeAboveText}
                            aria-invalid={errors.freeAboveText !== undefined}
                            onChange={(event) => onChange({ freeAboveText: event.target.value })}
                        />
                    ) : null}
                </div>
                <FieldError message={errors.freeAboveText} />
            </div>
        </section>
    )
}
