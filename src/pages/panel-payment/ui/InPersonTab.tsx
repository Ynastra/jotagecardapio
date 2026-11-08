import type { PixKeyType } from '@/entities/store'
import { PixPayment } from '@/shared/ui'

import type { MethodForm, PaymentForm, PaymentFormErrors } from '../model/payment-form'
import { PIX_KEY_MAX, PIX_KEY_TYPE_LABELS, PIX_KEY_TYPES, pixKeyForDisplay } from '../model/pix-key'
import styles from './payment.module.css'
import { MethodRow } from './MethodRow'

const SAMPLE_TOTAL_CENTS = 4590
const SAMPLE_KEY = 'sua-chave-pix'

type InPersonTabProps = {
    form: PaymentForm
    errors: PaymentFormErrors
    onChange: (change: (current: PaymentForm) => PaymentForm) => void
}

export function InPersonTab({ form, errors, onChange }: InPersonTabProps) {
    const previewKey = pixKeyForDisplay(form.pixKeyType, form.pixKey) || SAMPLE_KEY
    const previewKind = form.pixKeyType === '' ? null : form.pixKeyType

    function changeMethod(method: MethodForm['method'], patch: Partial<MethodForm>) {
        onChange((current) => ({
            ...current,
            methods: current.methods.map((rule) => (rule.method === method ? { ...rule, ...patch } : rule)),
        }))
    }

    return (
        <div className={styles.layout}>
            <div className={styles.main}>
                <section className={styles.section} aria-label="Formas de pagamento">
                    <h2 className={styles.sectionTitle}>Formas de pagamento</h2>
                    {errors.delivery ? (
                        <p className={styles.listError} role="alert">
                            {errors.delivery}
                        </p>
                    ) : null}
                    {errors.pickup ? (
                        <p className={styles.listError} role="alert">
                            {errors.pickup}
                        </p>
                    ) : null}
                    <ul className={styles.methods}>
                        {form.methods.map((rule) => (
                            <MethodRow
                                key={rule.method}
                                rule={rule}
                                error={errors.fees[rule.method]}
                                onChange={(patch) => changeMethod(rule.method, patch)}
                            />
                        ))}
                    </ul>
                </section>

                <section className={styles.section} aria-label="Chave Pix">
                    <h2 className={styles.sectionTitle}>Pix estático</h2>
                    <div className={styles.fieldRow}>
                        <label className={styles.field}>
                            Tipo da chave
                            <select
                                value={form.pixKeyType}
                                aria-invalid={errors.pixKeyType !== undefined}
                                onChange={(event) =>
                                    onChange((current) => ({
                                        ...current,
                                        pixKeyType: event.target.value as PixKeyType | '',
                                    }))
                                }
                            >
                                <option value="">Escolha o tipo</option>
                                {PIX_KEY_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {PIX_KEY_TYPE_LABELS[type]}
                                    </option>
                                ))}
                            </select>
                            {errors.pixKeyType ? <span className={styles.fieldError}>{errors.pixKeyType}</span> : null}
                        </label>
                        <label className={styles.field}>
                            Chave Pix
                            <input
                                value={form.pixKey}
                                maxLength={PIX_KEY_MAX}
                                aria-invalid={errors.pixKey !== undefined}
                                onChange={(event) => onChange((current) => ({ ...current, pixKey: event.target.value }))}
                            />
                            {errors.pixKey ? <span className={styles.fieldError}>{errors.pixKey}</span> : null}
                        </label>
                    </div>
                    <p className={styles.hint}>CNPJ, CPF e telefone são gravados só com números.</p>
                </section>
            </div>

            <aside className={styles.preview} aria-label="Prévia da tela do Pix">
                <span className={styles.previewLabel}>Como o cliente vê o Pix</span>
                <div className={styles.previewFrame}>
                    <PixPayment
                        totalCents={SAMPLE_TOTAL_CENTS}
                        pixKey={previewKey}
                        pixKeyKind={previewKind}
                        receiptUrl="#"
                    />
                </div>
            </aside>
        </div>
    )
}
