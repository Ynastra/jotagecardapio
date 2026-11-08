import type { DeliveryMode, StoreSettings, StoreSettingsPatch } from '@/entities/store'
import { parseReaisToCents } from '@/shared/lib'

export const PREP_TIME_MIN = 1
export const PREP_TIME_MAX = 240
export const MAX_RADIUS_KM = 50

const CENTS_PER_REAL = 100
const KM_DECIMALS = 1
const COORDINATE_DECIMALS = 6
const MAX_LATITUDE = 90
const MAX_LONGITUDE = 180

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
    latitudeText: string
    longitudeText: string
    locationQuery: string
    locationFallbackQuery: string
}

export type DeliveryFieldName =
    | 'prepTimeText'
    | 'mode'
    | 'feeText'
    | 'maxKmText'
    | 'freeAboveText'
    | 'latitudeText'
    | 'longitudeText'

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

export function formatCoordinateText(coordinate: number | null): string {
    const text = coordinate === null ? '' : String(coordinate).replace('.', ',')
    return text
}

function joinLocationQuery(settings: StoreSettings): string {
    const parts = [settings.address, settings.city, settings.state]
    const query = parts
        .map((part) => (part ?? '').trim())
        .filter(Boolean)
        .join(', ')
    return query
}

// O Nominatim não acha o texto com número e bairro; só o logradouro, a cidade e a UF costumam bastar.
function joinFallbackLocationQuery(settings: StoreSettings): string {
    const street = (settings.address ?? '').split(',')[0]
    const parts = [street, settings.city, settings.state]
    const query = parts
        .map((part) => (part ?? '').trim())
        .filter(Boolean)
        .join(', ')
    return query
}

export function listLocationQueries(form: Pick<DeliveryForm, 'locationQuery' | 'locationFallbackQuery'>): string[] {
    const candidates = [form.locationQuery, form.locationFallbackQuery]
    const queries = candidates.filter((query, index) => query !== '' && candidates.indexOf(query) === index)
    return queries
}

export function formFromSettings(settings: StoreSettings): DeliveryForm {
    const form = {
        prepTimeText: String(settings.prepTimeMinutes),
        mode: settings.deliveryMode,
        feeText: formatCentsText(settings.deliveryFeeCents),
        maxKmText: formatKmText(settings.deliveryMaxKm),
        hasFreeDelivery: settings.freeDeliveryAboveCents !== null,
        freeAboveText: settings.freeDeliveryAboveCents === null ? '' : formatCentsText(settings.freeDeliveryAboveCents),
        latitudeText: formatCoordinateText(settings.latitude),
        longitudeText: formatCoordinateText(settings.longitude),
        locationQuery: joinLocationQuery(settings),
        locationFallbackQuery: joinFallbackLocationQuery(settings),
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

function parseCoordinate(text: string, limit: number): number | null {
    const coordinate = Number(text.trim().replace(',', '.'))
    const isValid = text.trim() !== '' && Number.isFinite(coordinate) && Math.abs(coordinate) <= limit

    const parsed = isValid ? Number(coordinate.toFixed(COORDINATE_DECIMALS)) : null
    return parsed
}

export function readFormCoordinates(form: DeliveryForm): { latitude: number; longitude: number } | null {
    const latitude = parseCoordinate(form.latitudeText, MAX_LATITUDE)
    const longitude = parseCoordinate(form.longitudeText, MAX_LONGITUDE)

    const coordinates = latitude === null || longitude === null ? null : { latitude, longitude }
    return coordinates
}

function collectLocationErrors(form: DeliveryForm): DeliveryFormErrors {
    const errors: DeliveryFormErrors = {}
    const hasLatitude = form.latitudeText.trim() !== ''
    const hasLongitude = form.longitudeText.trim() !== ''

    if (hasLatitude !== hasLongitude) {
        const missingField = hasLatitude ? 'longitudeText' : 'latitudeText'
        errors[missingField] = 'Preencha latitude e longitude juntas.'
        return errors
    }
    if (hasLatitude && parseCoordinate(form.latitudeText, MAX_LATITUDE) === null) {
        errors.latitudeText = `Informe uma latitude entre -${MAX_LATITUDE} e ${MAX_LATITUDE}.`
    }
    if (hasLongitude && parseCoordinate(form.longitudeText, MAX_LONGITUDE) === null) {
        errors.longitudeText = `Informe uma longitude entre -${MAX_LONGITUDE} e ${MAX_LONGITUDE}.`
    }
    return errors
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
    if (form.mode === 'radius') {
        Object.assign(errors, collectLocationErrors(form))
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
        patch.latitude = parseCoordinate(form.latitudeText, MAX_LATITUDE)
        patch.longitude = parseCoordinate(form.longitudeText, MAX_LONGITUDE)
    }
    return patch
}

export function validateDeliveryForm(form: DeliveryForm, activeZoneCount: number): DeliveryFormResult {
    const errors = collectErrors(form, activeZoneCount)
    const hasErrors = Object.keys(errors).length > 0

    const value = hasErrors ? null : buildPatch(form)
    return { errors, value }
}
