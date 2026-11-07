import { useState, type FormEvent } from 'react'

import { FULFILLMENT_LABELS, PAYMENT_LABELS, type DraftLine, type PlacedOrder, type OrderMessageContext } from '@/entities/order'
import { formatBrazilianPhone, formatCents, keepDigits, readStoredJson, writeStoredJson } from '@/shared/lib'
import { Button, Sheet, StatusMessage, ThemeIcon, type IconName } from '@/shared/ui'

import { placeOrder, PlaceOrderError } from '../api/place-order'
import {
    buildPlaceOrderPayload,
    calculateOrderTotals,
    describeOrderError,
    EMPTY_CHECKOUT_FORM,
    getAvailableFulfillment,
    getAvailablePaymentMethod,
    getAvailablePaymentMethods,
    REMEMBERED_FIELDS,
    validateCheckout,
    type CheckoutForm,
} from '../model/checkout'
import type { Store } from '../model/types'
import { CartLines } from './CartLines'
import styles from './checkout-sheet.module.css'

const CUSTOMER_STORAGE_KEY = 'jgcardapio:cliente'
const MAX_NOTES_LENGTH = 280

const PAYMENT_ICONS: Record<CheckoutForm['paymentMethod'], IconName> = {
    pix: 'pix',
    cash: 'dinheiro',
    credit: 'cartao',
    debit: 'cartao',
    meal_voucher: 'cartao',
    food_voucher: 'cartao',
}

type CheckoutSheetProps = {
    store: Store
    lines: readonly DraftLine[]
    subtotalCents: number
    isStoreOpen: boolean
    onSetQuantity: (key: string, quantity: number) => void
    onPlaced: (order: PlacedOrder, context: OrderMessageContext) => void
    onClose: () => void
}

function loadInitialForm(store: Store): CheckoutForm {
    const remembered = readStoredJson<Partial<CheckoutForm>>(CUSTOMER_STORAGE_KEY, {})
    const merged = { ...EMPTY_CHECKOUT_FORM, ...remembered }

    const fulfillment = getAvailableFulfillment(store, merged.fulfillment)
    const paymentMethod = getAvailablePaymentMethod(store, fulfillment, merged.paymentMethod)
    const form = { ...merged, fulfillment, paymentMethod }
    return form
}

function rememberCustomer(form: CheckoutForm): void {
    const remembered = Object.fromEntries(REMEMBERED_FIELDS.map((field) => [field, form[field]]))
    writeStoredJson(CUSTOMER_STORAGE_KEY, remembered)
}

export function CheckoutSheet({
    store,
    lines,
    subtotalCents,
    isStoreOpen,
    onSetQuantity,
    onPlaced,
    onClose,
}: CheckoutSheetProps) {
    const [form, setForm] = useState<CheckoutForm>(() => loadInitialForm(store))
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSubmitting, setSubmitting] = useState(false)

    const { deliveryFeeCents, paymentFeeCents, totalCents } = calculateOrderTotals(store, form, subtotalCents)
    const paymentOptions = getAvailablePaymentMethods(store, form.fulfillment)
    const isEmpty = lines.length === 0
    const fulfillmentOptions = (['delivery', 'pickup'] as const).filter((option) =>
        option === 'delivery' ? store.acceptsDelivery : store.acceptsPickup,
    )

    function update<Field extends keyof CheckoutForm>(field: Field, value: CheckoutForm[Field]) {
        setForm((current) => ({ ...current, [field]: value }))
    }

    function changeFulfillment(fulfillment: CheckoutForm['fulfillment']) {
        setForm((current) => ({
            ...current,
            fulfillment,
            paymentMethod: getAvailablePaymentMethod(store, fulfillment, current.paymentMethod),
        }))
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const validationError = validateCheckout(form, store, subtotalCents)

        if (validationError) {
            setErrorMessage(validationError)
            return
        }

        setErrorMessage(null)
        setSubmitting(true)
        const payload = buildPlaceOrderPayload(store.slug, form, lines)

        try {
            const order = await placeOrder(payload)
            rememberCustomer(form)
            onPlaced(order, {
                storeName: store.name,
                customerName: payload.customer_name,
                customerPhone: payload.customer_phone,
                fulfillment: form.fulfillment,
                paymentMethod: form.paymentMethod,
                notes: payload.notes || null,
            })
        } catch (error) {
            const code = error instanceof PlaceOrderError ? error.code : 'network_error'
            setErrorMessage(describeOrderError(code))
        } finally {
            setSubmitting(false)
        }
    }

    if (isEmpty) {
        return (
            <Sheet title="Sua sacola" onClose={onClose}>
                <StatusMessage illustration="sacola-vazia" title="Sua sacola está vazia">
                    <p>Escolha um item do cardápio para começar o pedido.</p>
                </StatusMessage>
            </Sheet>
        )
    }

    const footer = (
        <div className={styles.footerContent}>
            {isStoreOpen ? null : <p className={styles.closedWarning}>A loja está fechada. O envio libera quando ela abrir.</p>}
            <Button type="submit" form="checkout-form" wide disabled={!isStoreOpen || isSubmitting}>
                {isSubmitting ? 'Enviando pedido' : `Enviar pedido · ${formatCents(totalCents)}`}
            </Button>
        </div>
    )

    return (
        <Sheet title="Sua sacola" onClose={onClose} footer={footer}>
            <form id="checkout-form" className={styles.form} onSubmit={handleSubmit} noValidate>
                <CartLines lines={lines} onSetQuantity={onSetQuantity} />

                <fieldset className={styles.section}>
                    <legend className={styles.sectionTitle}>Como quer receber?</legend>
                    <div className={styles.choices}>
                        {fulfillmentOptions.map((option) => (
                            <label key={option} className={styles.choice}>
                                <input
                                    type="radio"
                                    name="fulfillment"
                                    checked={form.fulfillment === option}
                                    onChange={() => changeFulfillment(option)}
                                />
                                <ThemeIcon name={option === 'delivery' ? 'entrega' : 'retirada'} size={22} />
                                {FULFILLMENT_LABELS[option]}
                            </label>
                        ))}
                    </div>

                    {form.fulfillment === 'delivery' ? (
                        <div className={styles.fields}>
                            {store.deliveryZones.length > 0 ? (
                                <label className={styles.field}>
                                    Bairro
                                    <select
                                        value={form.deliveryZoneId}
                                        onChange={(event) => update('deliveryZoneId', event.target.value)}
                                    >
                                        <option value="">Escolha o bairro</option>
                                        {store.deliveryZones.map((zone) => (
                                            <option key={zone.id} value={zone.id}>
                                                {zone.neighborhood} ({formatCents(zone.feeCents)})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <label className={styles.field}>
                                    Bairro
                                    <input
                                        autoComplete="address-level3"
                                        value={form.neighborhood}
                                        onChange={(event) => update('neighborhood', event.target.value)}
                                    />
                                </label>
                            )}
                            <div className={styles.fieldRow}>
                                <label className={`${styles.field} ${styles.grow}`}>
                                    Rua
                                    <input
                                        autoComplete="address-line1"
                                        value={form.street}
                                        onChange={(event) => update('street', event.target.value)}
                                    />
                                </label>
                                <label className={`${styles.field} ${styles.short}`}>
                                    Número
                                    <input
                                        inputMode="numeric"
                                        value={form.number}
                                        onChange={(event) => update('number', event.target.value)}
                                    />
                                </label>
                            </div>
                            <label className={styles.field}>
                                Complemento
                                <input
                                    autoComplete="address-line2"
                                    placeholder="Apto, bloco, casa dos fundos"
                                    value={form.complement}
                                    onChange={(event) => update('complement', event.target.value)}
                                />
                            </label>
                            <label className={styles.field}>
                                Ponto de referência
                                <input value={form.reference} onChange={(event) => update('reference', event.target.value)} />
                            </label>
                        </div>
                    ) : (
                        <p className={styles.hint}>
                            <ThemeIcon name="local" size={16} />
                            Retirar em {store.address ?? store.name}
                        </p>
                    )}
                </fieldset>

                <fieldset className={styles.section}>
                    <legend className={styles.sectionTitle}>Seus dados</legend>
                    <div className={styles.fields}>
                        <label className={styles.field}>
                            Nome
                            <input
                                autoComplete="name"
                                value={form.customerName}
                                onChange={(event) => update('customerName', event.target.value)}
                            />
                        </label>
                        <label className={styles.field}>
                            Celular com DDD
                            <input
                                type="tel"
                                autoComplete="tel-national"
                                inputMode="tel"
                                placeholder="(18) 99999-9999"
                                value={formatBrazilianPhone(form.customerPhone)}
                                onChange={(event) => update('customerPhone', keepDigits(event.target.value))}
                            />
                        </label>
                    </div>
                </fieldset>

                <fieldset className={styles.section}>
                    <legend className={styles.sectionTitle}>Pagamento na entrega ou retirada</legend>
                    <div className={styles.choices}>
                        {paymentOptions.map(({ method }) => (
                            <label key={method} className={styles.choice}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    checked={form.paymentMethod === method}
                                    onChange={() => update('paymentMethod', method)}
                                />
                                <ThemeIcon name={PAYMENT_ICONS[method]} size={22} />
                                {PAYMENT_LABELS[method]}
                            </label>
                        ))}
                    </div>
                    {form.paymentMethod === 'cash' ? (
                        <label className={styles.field}>
                            Troco para quanto? (deixe vazio se não precisar)
                            <input
                                inputMode="decimal"
                                placeholder="Ex.: 100"
                                value={form.changeFor}
                                onChange={(event) => update('changeFor', event.target.value)}
                            />
                        </label>
                    ) : null}
                </fieldset>

                <fieldset className={styles.section}>
                    <legend className={styles.sectionTitle}>Observações do pedido</legend>
                    <textarea
                        rows={2}
                        maxLength={MAX_NOTES_LENGTH}
                        placeholder="Ex.: interfone quebrado, chamar no portão"
                        value={form.notes}
                        onChange={(event) => update('notes', event.target.value)}
                    />
                </fieldset>

                <dl className={styles.summary}>
                    <div className={styles.summaryRow}>
                        <dt>Subtotal</dt>
                        <dd>{formatCents(subtotalCents)}</dd>
                    </div>
                    {form.fulfillment === 'delivery' ? (
                        <div className={styles.summaryRow}>
                            <dt>Entrega</dt>
                            <dd>{deliveryFeeCents > 0 ? formatCents(deliveryFeeCents) : 'Grátis'}</dd>
                        </div>
                    ) : null}
                    {paymentFeeCents > 0 ? (
                        <div className={styles.summaryRow}>
                            <dt>Taxa de pagamento</dt>
                            <dd>{formatCents(paymentFeeCents)}</dd>
                        </div>
                    ) : null}
                    <div className={`${styles.summaryRow} ${styles.total}`}>
                        <dt>Total</dt>
                        <dd>{formatCents(totalCents)}</dd>
                    </div>
                </dl>

                {errorMessage ? (
                    <p className={styles.error} role="alert">
                        <ThemeIcon name="alerta" size={18} />
                        {errorMessage}
                    </p>
                ) : null}
            </form>
        </Sheet>
    )
}
