import { parseReaisToCents } from '@/shared/lib'

import { GROUP_DESCRIPTION_MAX, GROUP_TITLE_MAX, OPTION_DESCRIPTION_MAX, OPTION_NAME_MAX } from './addon-group'

export type GroupDraft = { title: string; description: string }
export type GroupValue = { title: string; description: string | null }
export type GroupFormErrors = Partial<Record<keyof GroupDraft, string>>

export type OptionDraft = {
    groupId: string
    name: string
    description: string
    priceText: string
    maxQuantityText: string
    imageUrl: string | null
}
export type OptionValue = {
    groupId: string
    name: string
    description: string | null
    priceCents: number
    maxQuantity: number | null
    imageUrl: string | null
}
export type OptionFormErrors = Partial<Record<'groupId' | 'name' | 'description' | 'priceText' | 'maxQuantityText', string>>

export const INVALID_PRICE_MESSAGE = 'Informe um preço válido'

const CENTS_PER_REAL = 100

// Texto do campo de preço para um valor salvo, no formato que parsePriceText lê.
export function formatPriceText(cents: number): string {
    const text = (cents / CENTS_PER_REAL).toFixed(2).replace('.', ',')
    return text
}

function emptyToNull(text: string): string | null {
    const trimmed = text.trim()
    const value = trimmed === '' ? null : trimmed
    return value
}

// Preço vazio vale zero (item sem custo); texto que não é número devolve null.
export function parsePriceText(text: string): number | null {
    if (text.trim() === '') {
        return 0
    }

    const cents = parseReaisToCents(text)
    return cents
}

export function validateGroupDraft(draft: GroupDraft): { errors: GroupFormErrors; value: GroupValue | null } {
    const errors: GroupFormErrors = {}
    const title = draft.title.trim()
    const description = draft.description.trim()

    if (title === '') {
        errors.title = 'Informe o título do grupo'
    } else if (title.length > GROUP_TITLE_MAX) {
        errors.title = `O título aceita até ${GROUP_TITLE_MAX} caracteres`
    }

    if (description.length > GROUP_DESCRIPTION_MAX) {
        errors.description = `A descrição aceita até ${GROUP_DESCRIPTION_MAX} caracteres`
    }

    if (Object.keys(errors).length > 0) {
        return { errors, value: null }
    }

    const value: GroupValue = { title, description: emptyToNull(description) }
    return { errors, value }
}

function parseMaxQuantity(text: string): { error: string | null; value: number | null } {
    const trimmed = text.trim()
    if (trimmed === '') {
        return { error: null, value: null }
    }

    const quantity = Number(trimmed)
    if (!Number.isInteger(quantity) || quantity < 1) {
        return { error: 'Informe um número inteiro a partir de 1, ou deixe vazio', value: null }
    }

    return { error: null, value: quantity }
}

export function validateOptionDraft(draft: OptionDraft): { errors: OptionFormErrors; value: OptionValue | null } {
    const errors: OptionFormErrors = {}
    const name = draft.name.trim()
    const description = draft.description.trim()
    const priceCents = parsePriceText(draft.priceText)
    const maxQuantity = parseMaxQuantity(draft.maxQuantityText)

    if (draft.groupId === '') {
        errors.groupId = 'Escolha o grupo'
    }

    if (name === '') {
        errors.name = 'Informe o nome do item'
    } else if (name.length > OPTION_NAME_MAX) {
        errors.name = `O nome aceita até ${OPTION_NAME_MAX} caracteres`
    }

    if (description.length > OPTION_DESCRIPTION_MAX) {
        errors.description = `A descrição aceita até ${OPTION_DESCRIPTION_MAX} caracteres`
    }

    if (priceCents === null) {
        errors.priceText = INVALID_PRICE_MESSAGE
    }

    if (maxQuantity.error) {
        errors.maxQuantityText = maxQuantity.error
    }

    if (Object.keys(errors).length > 0 || priceCents === null) {
        return { errors, value: null }
    }

    const value: OptionValue = {
        groupId: draft.groupId,
        name,
        description: emptyToNull(description),
        priceCents,
        maxQuantity: maxQuantity.value,
        imageUrl: draft.imageUrl,
    }
    return { errors, value }
}
