import { parseReaisToCents } from '@/shared/lib'

export const NEIGHBORHOOD_MAX = 80

export type DeliveryZone = {
    id: string
    neighborhood: string
    feeCents: number
    active: boolean
}

export type ZoneDraft = {
    neighborhood: string
    feeText: string
}

export type ZoneValue = {
    neighborhood: string
    feeCents: number
}

export type ZoneFormErrors = Partial<Record<'neighborhood' | 'feeText', string>>

export type ZoneFormResult = {
    errors: ZoneFormErrors
    value: ZoneValue | null
}

function normalizeName(name: string): string {
    const normalized = name.trim().toLocaleLowerCase('pt-BR')
    return normalized
}

export function countActiveZones(zones: readonly DeliveryZone[]): number {
    const count = zones.filter((zone) => zone.active).length
    return count
}

export const LAST_ACTIVE_ZONE_MESSAGE =
    'É o último bairro ativo. Com entrega Por bairro, a loja ficaria sem bairro para entregar. Mude a modalidade e salve antes.'

export function isLastActiveZone(zones: readonly DeliveryZone[], zoneId: string): boolean {
    const activeZones = zones.filter((zone) => zone.active)
    const isLast = activeZones.length === 1 && activeZones[0].id === zoneId
    return isLast
}

function validateNeighborhood(name: string, others: readonly DeliveryZone[]): string | undefined {
    const trimmed = name.trim()
    if (trimmed === '') {
        return 'Informe o nome do bairro.'
    }
    if (trimmed.length > NEIGHBORHOOD_MAX) {
        return `Use até ${NEIGHBORHOOD_MAX} caracteres.`
    }

    const isDuplicate = others.some((zone) => normalizeName(zone.neighborhood) === normalizeName(trimmed))
    const error = isDuplicate ? 'Já existe um bairro com esse nome.' : undefined
    return error
}

// `others` são os demais bairros da loja, sem o que está sendo editado.
export function validateZoneDraft(draft: ZoneDraft, others: readonly DeliveryZone[]): ZoneFormResult {
    const feeCents = draft.feeText.trim() === '' ? null : parseReaisToCents(draft.feeText)
    const errors: ZoneFormErrors = {}

    const nameError = validateNeighborhood(draft.neighborhood, others)
    if (nameError) {
        errors.neighborhood = nameError
    }
    if (feeCents === null) {
        errors.feeText = 'Informe a taxa do bairro.'
    }

    const value = feeCents !== null && !nameError ? { neighborhood: draft.neighborhood.trim(), feeCents } : null
    return { errors, value }
}
