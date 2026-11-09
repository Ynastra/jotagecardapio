import type { AddressDisplay, StoreSettings, StoreSettingsPatch } from '@/entities/store'
import {
    formatNationalPhone,
    getContrastRatio,
    isHexColor,
    isValidBrazilianPhone,
    keepDigits,
    parseReaisToCents,
    pickReadableTextColor,
} from '@/shared/lib'

export const NAME_MAX = 80
export const ADDRESS_MAX = 200
export const CITY_MAX = 80
export const NOTICE_TITLE_MAX = 60
export const NOTICE_BODY_MAX = 300

export const BRAZIL_COUNTRY_CODE = '55'
export const PAGE_BACKGROUND_HEX = '#f6f3ef'
export const MIN_TEXT_CONTRAST = 4.5
export const MIN_BRAND_ON_PAGE_CONTRAST = 3

const CENTS_PER_REAL = 100

export const BRAZILIAN_STATES = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
] as const

export const ADDRESS_DISPLAY_LABELS: Record<AddressDisplay, string> = {
    hidden: 'Oculto',
    city: 'Cidade e UF',
    full: 'Completo',
}

export type StoreForm = {
    name: string
    whatsapp: string
    minOrderText: string
    address: string
    city: string
    state: string
    addressDisplay: AddressDisplay
    acceptsDelivery: boolean
    acceptsPickup: boolean
    requireCep: boolean
    orderCopyWhatsapp: boolean
    hideUnavailableItems: boolean
    cartNoticeTitle: string
    cartNoticeBody: string
    brandColor: string
    logoUrl: string | null
    coverUrl: string | null
}

export type StoreFieldName =
    | 'name'
    | 'whatsapp'
    | 'minOrderText'
    | 'address'
    | 'city'
    | 'state'
    | 'fulfillment'
    | 'cartNoticeTitle'
    | 'cartNoticeBody'
    | 'brandColor'

export type StoreFormErrors = Partial<Record<StoreFieldName, string>>

export type StoreFormResult = {
    errors: StoreFormErrors
    value: StoreSettingsPatch | null
}

export type BrandColorReport = {
    textRatio: number
    isTextReadable: boolean
    pageRatio: number
    isVisibleOnPage: boolean
}

function formatCentsText(cents: number): string {
    const text = cents === 0 ? '' : (cents / CENTS_PER_REAL).toFixed(2).replace('.', ',')
    return text
}

export function formFromSettings(settings: StoreSettings): StoreForm {
    const form = {
        name: settings.name,
        whatsapp: formatNationalPhone(settings.whatsapp),
        minOrderText: formatCentsText(settings.minOrderCents),
        address: settings.address ?? '',
        city: settings.city ?? '',
        state: settings.state ?? '',
        addressDisplay: settings.addressDisplay,
        acceptsDelivery: settings.acceptsDelivery,
        acceptsPickup: settings.acceptsPickup,
        requireCep: settings.requireCep,
        orderCopyWhatsapp: settings.orderCopyWhatsapp,
        hideUnavailableItems: settings.hideUnavailableItems,
        cartNoticeTitle: settings.cartNoticeTitle ?? '',
        cartNoticeBody: settings.cartNoticeBody ?? '',
        brandColor: settings.brandColor ?? '',
        logoUrl: settings.logoUrl,
        coverUrl: settings.coverUrl,
    }
    return form
}

export function isStoreFormDirty(initial: StoreForm, current: StoreForm): boolean {
    const keys = Object.keys(initial) as (keyof StoreForm)[]
    const isDirty = keys.some((key) => initial[key] !== current[key])
    return isDirty
}

// Se há ao menos uma forma de pagamento ligada em cada modo de atendimento.
export type PaymentCoverage = {
    delivery: boolean
    pickup: boolean
}

export function validateFulfillment(
    form: Pick<StoreForm, 'acceptsDelivery' | 'acceptsPickup'>,
    coverage: PaymentCoverage | null = null,
): string | undefined {
    const hasOne = form.acceptsDelivery || form.acceptsPickup
    if (!hasOne) {
        return 'Deixe pelo menos uma forma de atendimento ligada.'
    }
    if (coverage && form.acceptsDelivery && !coverage.delivery) {
        return 'Não há forma de pagamento ligada para entrega. Ligue uma em Pagamento antes de aceitar entrega.'
    }
    if (coverage && form.acceptsPickup && !coverage.pickup) {
        return 'Não há forma de pagamento ligada para retirada. Ligue uma em Pagamento antes de aceitar retirada.'
    }
    return undefined
}

function validateMaxLength(text: string, max: number): string | undefined {
    const error = text.trim().length > max ? `Use até ${max} caracteres.` : undefined
    return error
}

function validateName(name: string): string | undefined {
    const trimmed = name.trim()
    const error = trimmed === '' ? 'Informe o nome da loja.' : validateMaxLength(trimmed, NAME_MAX)
    return error
}

function validateMinOrder(minOrderText: string): string | undefined {
    const isFilled = minOrderText.trim() !== ''
    const error = isFilled && parseReaisToCents(minOrderText) === null ? 'Informe um valor válido.' : undefined
    return error
}

function validateState(state: string): string | undefined {
    const isKnown = state === '' || (BRAZILIAN_STATES as readonly string[]).includes(state)
    const error = isKnown ? undefined : 'Escolha uma UF da lista.'
    return error
}

function validateBrandColor(brandColor: string): string | undefined {
    const trimmed = brandColor.trim()
    const error = trimmed === '' || isHexColor(trimmed) ? undefined : 'Use o formato #RRGGBB.'
    return error
}

function collectErrors(form: StoreForm, coverage: PaymentCoverage | null): StoreFormErrors {
    const candidates: Record<StoreFieldName, string | undefined> = {
        name: validateName(form.name),
        whatsapp: isValidBrazilianPhone(form.whatsapp) ? undefined : 'Informe o WhatsApp com DDD.',
        minOrderText: validateMinOrder(form.minOrderText),
        address: validateMaxLength(form.address, ADDRESS_MAX),
        city: validateMaxLength(form.city, CITY_MAX),
        state: validateState(form.state),
        fulfillment: validateFulfillment(form, coverage),
        cartNoticeTitle: validateMaxLength(form.cartNoticeTitle, NOTICE_TITLE_MAX),
        cartNoticeBody: validateMaxLength(form.cartNoticeBody, NOTICE_BODY_MAX),
        brandColor: validateBrandColor(form.brandColor),
    }

    const errors: StoreFormErrors = {}
    for (const [field, message] of Object.entries(candidates)) {
        if (message) {
            errors[field as StoreFieldName] = message
        }
    }
    return errors
}

function textOrNull(text: string): string | null {
    const trimmed = text.trim()
    const value = trimmed === '' ? null : trimmed
    return value
}

function buildPatch(form: StoreForm): StoreSettingsPatch {
    const patch = {
        name: form.name.trim(),
        whatsapp: `${BRAZIL_COUNTRY_CODE}${keepDigits(form.whatsapp)}`,
        minOrderCents: parseReaisToCents(form.minOrderText) ?? 0,
        address: textOrNull(form.address),
        city: textOrNull(form.city),
        state: textOrNull(form.state),
        addressDisplay: form.addressDisplay,
        acceptsDelivery: form.acceptsDelivery,
        acceptsPickup: form.acceptsPickup,
        requireCep: form.requireCep,
        orderCopyWhatsapp: form.orderCopyWhatsapp,
        hideUnavailableItems: form.hideUnavailableItems,
        cartNoticeTitle: textOrNull(form.cartNoticeTitle),
        cartNoticeBody: textOrNull(form.cartNoticeBody),
        brandColor: textOrNull(form.brandColor),
        logoUrl: form.logoUrl,
        coverUrl: form.coverUrl,
    }
    return patch
}

export function validateStoreForm(form: StoreForm, coverage: PaymentCoverage | null = null): StoreFormResult {
    const errors = collectErrors(form, coverage)
    const hasErrors = Object.keys(errors).length > 0

    const value = hasErrors ? null : buildPatch(form)
    return { errors, value }
}

export function describeBrandColor(brandColor: string): BrandColorReport | null {
    const trimmed = brandColor.trim()
    if (!isHexColor(trimmed)) {
        return null
    }

    const textRatio = getContrastRatio(pickReadableTextColor(trimmed), trimmed)
    const pageRatio = getContrastRatio(trimmed, PAGE_BACKGROUND_HEX)
    const report = {
        textRatio,
        isTextReadable: textRatio >= MIN_TEXT_CONTRAST,
        pageRatio,
        isVisibleOnPage: pageRatio >= MIN_BRAND_ON_PAGE_CONTRAST,
    }
    return report
}

export function formatRatio(ratio: number): string {
    const text = `${ratio.toFixed(1).replace('.', ',')}:1`
    return text
}
