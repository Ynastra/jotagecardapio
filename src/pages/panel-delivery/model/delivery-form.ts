import type { DeliveryMode, StoreSettings, StoreSettingsPatch } from '@/entities/store'
import { parseReaisToCents } from '@/shared/lib'

export const PREP_TIME_MIN = 1
export const PREP_TIME_MAX = 240
export const MAX_RADIUS_KM = 50

const CENTS_PER_REAL = 100
const KM_DECIMALS = 1

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
    fixed: 'Taxa fixa',
    radius: 'Raio de km',
    neighborhood: 'Por bairro',
}

export const DELIVERY_MODES: readonly DeliveryMode[] = ['fixed', 'radius', 'neighborhood']

export type DeliveryForm = {
    prepTimeText: string
    mode: DeliveryMode
    feeText: string
    maxKmText: string
    hasFreeDelivery: boolean
    freeAboveText: string
}

export type DeliveryFieldName = 'prepTimeText' | 'mode' | 'feeText' | 'maxKmText' | 'freeAboveText'

export type DeliveryFormErrors = Partial<Record<DeliveryFieldName, string>>

export type DeliveryFormResult = {
    errors: DeliveryFormErrors
    value: StoreSettingsPatch | null
}

export function formatCentsText(cents: number): string {
    const text = (cents / CENTS_PER_REAL).toFixed(2).replace('.', ',')
    return text
}

function formatKmText(km: number | null): string {
    const text = km === null ? '' : String(km).replace('.', ',')
    return text
}

export function formFromSettings(settings: StoreSettings): DeliveryForm {
    const form = {
        prepTimeText: String(settings.prepTimeMinutes),
        mode: settings.deliveryMode,
        feeText: formatCentsText(settings.deliveryFeeCents),
        maxKmText: formatKmText(settings.deliveryMaxKm),
        hasFreeDelivery: settings.freeDeliveryAboveCents !== null,
        freeAboveText: settings.freeDeliveryAboveCents === null ? '' : formatCentsText(settings.freeDeliveryAboveCents),
    }
    return form
}

export function isDeliveryFormDirty(initial: DeliveryForm, current: DeliveryForm): boolean {
    const keys = Object.keys(initial) as (keyof DeliveryForm)[]
    const isDirty = keys.some((key) => initial[key] !== current[key])
    return isDirty
}

function parsePrepTime(text: string): number | null {
    const trimmed = text.trim()
    const minutes = Number(trimmed)
    const isValid = /^\d+$/.test(trimmed) && minutes >= PREP_TIME_MIN && minutes <= PREP_TIME_MAX

    const parsed = isValid ? minutes : null
    return parsed
}

function parseKm(text: string): number | null {
    const km = Number(text.trim().replace(',', '.'))
    const isValid = text.trim() !== '' && Number.isFinite(km) && km > 0 && km <= MAX_RADIUS_KM

    const parsed = isValid ? Number(km.toFixed(KM_DECIMALS)) : null
    return parsed
}

function parseMoney(text: string): number | null {
    const cents = text.trim() === '' ? null : parseReaisToCents(text)
    return cents
}

function collectErrors(form: DeliveryForm, activeZoneCount: number): DeliveryFormErrors {
    const errors: DeliveryFormErrors = {}
    const chargesFlatFee = form.mode !== 'neighborhood'

    if (parsePrepTime(form.prepTimeText) === null) {
        errors.prepTimeText = `Informe o tempo de preparo, de ${PREP_TIME_MIN} a ${PREP_TIME_MAX} minutos.`
    }
    if (chargesFlatFee && parseMoney(form.feeText) === null) {
        errors.feeText = 'Informe a taxa de entrega.'
    }
    if (form.mode === 'radius' && parseKm(form.maxKmText) === null) {
        errors.maxKmText = `Informe o raio máximo, de mais de 0 até ${MAX_RADIUS_KM} km.`
    }
    if (form.mode === 'neighborhood' && activeZoneCount === 0) {
        errors.mode = 'Ative pelo menos um bairro para entregar por bairro.'
    }
    if (form.hasFreeDelivery && parseMoney(form.freeAboveText) === null) {
        errors.freeAboveText = 'Informe o valor do pedido a partir do qual a entrega é grátis.'
    }
    return errors
}

function buildPatch(form: DeliveryForm): StoreSettingsPatch {
    const patch: StoreSettingsPatch = {
        prepTimeMinutes: parsePrepTime(form.prepTimeText) ?? PREP_TIME_MIN,
        deliveryMode: form.mode,
        freeDeliveryAboveCents: form.hasFreeDelivery ? parseMoney(form.freeAboveText) : null,
    }

    if (form.mode !== 'neighborhood') {
        patch.deliveryFeeCents = parseMoney(form.feeText) ?? 0
    }
    if (form.mode === 'radius') {
        patch.deliveryMaxKm = parseKm(form.maxKmText)
    }
    return patch
}

export function validateDeliveryForm(form: DeliveryForm, activeZoneCount: number): DeliveryFormResult {
    const errors = collectErrors(form, activeZoneCount)
    const hasErrors = Object.keys(errors).length > 0

    const value = hasErrors ? null : buildPatch(form)
    return { errors, value }
}
