import type { PaymentMethod } from '@/entities/order'
import type { PixKeyType, StoreSettings } from '@/entities/store'
import { parseReaisToCents } from '@/shared/lib'

import { normalizePixKey } from './pix-key'

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
    'pix',
    'cash',
    'credit',
    'debit',
    'meal_voucher',
    'food_voucher',
]

export const MAX_FEE_PERCENT = 100

const CENTS_PER_REAL = 100
const PERCENT_DECIMALS = 2

export type FeeKind = 'percent' | 'fixed'

export type MethodRule = {
    method: PaymentMethod
    enabledDelivery: boolean
    enabledPickup: boolean
    feeKind: FeeKind
    feePercent: number
    feeFixedCents: number
}

export type MethodForm = {
    method: PaymentMethod
    enabledDelivery: boolean
    enabledPickup: boolean
    feeKind: FeeKind
    feePercentText: string
    feeFixedText: string
}

export type PaymentForm = {
    methods: MethodForm[]
    pixKeyType: PixKeyType | ''
    pixKey: string
}

export type Fulfillments = {
    acceptsDelivery: boolean
    acceptsPickup: boolean
}

export type PaymentFormErrors = {
    delivery?: string
    pickup?: string
    pixKeyType?: string
    pixKey?: string
    fees: Partial<Record<PaymentMethod, string>>
}

export type PixValue = {
    pixKey: string | null
    pixKeyType: PixKeyType | null
}

export type PaymentValue = {
    rules: MethodRule[]
    pix: PixValue
}

export type PaymentFormResult = {
    errors: PaymentFormErrors
    value: PaymentValue | null
}

function formatMoneyText(cents: number): string {
    const text = cents === 0 ? '' : (cents / CENTS_PER_REAL).toFixed(2).replace('.', ',')
    return text
}

function formatPercentText(percent: number): string {
    const text = percent === 0 ? '' : String(percent).replace('.', ',')
    return text
}

function emptyMethodForm(method: PaymentMethod): MethodForm {
    const form = {
        method,
        enabledDelivery: false,
        enabledPickup: false,
        feeKind: 'fixed' as const,
        feePercentText: '',
        feeFixedText: '',
    }
    return form
}

function methodFormFromRule(rule: MethodRule): MethodForm {
    const form = {
        method: rule.method,
        enabledDelivery: rule.enabledDelivery,
        enabledPickup: rule.enabledPickup,
        feeKind: rule.feeKind,
        feePercentText: formatPercentText(rule.feePercent),
        feeFixedText: formatMoneyText(rule.feeFixedCents),
    }
    return form
}

export function formFromData(rules: readonly MethodRule[], settings: Pick<StoreSettings, 'pixKey' | 'pixKeyType'>): PaymentForm {
    const methods = PAYMENT_METHODS.map((method) => {
        const rule = rules.find((candidate) => candidate.method === method)
        return rule ? methodFormFromRule(rule) : emptyMethodForm(method)
    })

    const pixKeyType: PaymentForm['pixKeyType'] = settings.pixKeyType ?? ''
    const form = { methods, pixKeyType, pixKey: settings.pixKey ?? '' }
    return form
}

export function isPaymentFormDirty(initial: PaymentForm, current: PaymentForm): boolean {
    const isDirty = JSON.stringify(initial) !== JSON.stringify(current)
    return isDirty
}

function parsePercent(text: string): number | null {
    const trimmed = text.trim()
    if (trimmed === '') {
        return 0
    }

    const percent = Number(trimmed.replace(',', '.'))
    const isValid = Number.isFinite(percent) && percent >= 0 && percent <= MAX_FEE_PERCENT
    const parsed = isValid ? Number(percent.toFixed(PERCENT_DECIMALS)) : null
    return parsed
}

function parseFixedCents(text: string): number | null {
    const cents = text.trim() === '' ? 0 : parseReaisToCents(text)
    return cents
}

function validateFee(rule: MethodForm): string | undefined {
    if (rule.feeKind === 'percent') {
        const error = parsePercent(rule.feePercentText) === null ? `Informe uma taxa de 0 a ${MAX_FEE_PERCENT}%.` : undefined
        return error
    }

    const error = parseFixedCents(rule.feeFixedText) === null ? 'Informe um valor em reais.' : undefined
    return error
}

function toRule(form: MethodForm): MethodRule {
    const rule = {
        method: form.method,
        enabledDelivery: form.enabledDelivery,
        enabledPickup: form.enabledPickup,
        feeKind: form.feeKind,
        feePercent: parsePercent(form.feePercentText) ?? 0,
        feeFixedCents: parseFixedCents(form.feeFixedText) ?? 0,
    }
    return rule
}

function validatePix(form: PaymentForm, isPixOn: boolean): { errors: Pick<PaymentFormErrors, 'pixKey' | 'pixKeyType'>; pix: PixValue } {
    const hasKey = form.pixKey.trim() !== ''
    const noPix = { pixKey: null, pixKeyType: null }

    if (!hasKey) {
        const errors = isPixOn ? { pixKey: 'Pix ligado precisa de uma chave.' } : {}
        return { errors, pix: noPix }
    }
    if (form.pixKeyType === '') {
        return { errors: { pixKeyType: 'Escolha o tipo da chave.' }, pix: noPix }
    }

    const normalized = normalizePixKey(form.pixKeyType, form.pixKey)
    const errors = normalized.error ? { pixKey: normalized.error } : {}
    return { errors, pix: { pixKey: normalized.value, pixKeyType: form.pixKeyType } }
}

function validateCoverage(form: PaymentForm, accepts: Fulfillments): Pick<PaymentFormErrors, 'delivery' | 'pickup'> {
    const errors: Pick<PaymentFormErrors, 'delivery' | 'pickup'> = {}

    if (accepts.acceptsDelivery && !form.methods.some((rule) => rule.enabledDelivery)) {
        errors.delivery = 'Ligue pelo menos uma forma de pagamento para entrega.'
    }
    if (accepts.acceptsPickup && !form.methods.some((rule) => rule.enabledPickup)) {
        errors.pickup = 'Ligue pelo menos uma forma de pagamento para retirada.'
    }
    return errors
}

export function validatePaymentForm(form: PaymentForm, accepts: Fulfillments): PaymentFormResult {
    const fees: PaymentFormErrors['fees'] = {}
    for (const rule of form.methods) {
        const feeError = validateFee(rule)
        if (feeError) {
            fees[rule.method] = feeError
        }
    }

    const pixRule = form.methods.find((rule) => rule.method === 'pix')
    const isPixOn = Boolean(pixRule?.enabledDelivery || pixRule?.enabledPickup)
    const pixResult = validatePix(form, isPixOn)
    const fieldErrors = { ...validateCoverage(form, accepts), ...pixResult.errors }

    const hasErrors = Object.keys(fees).length > 0 || Object.keys(fieldErrors).length > 0
    const value = hasErrors ? null : { rules: form.methods.map(toRule), pix: pixResult.pix }
    return { errors: { ...fieldErrors, fees }, value }
}
