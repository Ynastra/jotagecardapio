import type { DraftLineOption } from '@/entities/order'

import type { OptionGroup, ProductOption, Product } from './types'

// Quantidade escolhida de cada opcional, pelo id do opcional.
export type OptionSelection = Readonly<Record<string, number>>

export type GroupInputKind = 'single' | 'multiple' | 'quantity'

export function getEffectivePriceCents(product: Pick<Product, 'priceCents' | 'promoPriceCents'>): number {
    const price = product.promoPriceCents ?? product.priceCents
    return price
}

export function getGroupInputKind(group: OptionGroup): GroupInputKind {
    if (group.maxChoices === 1) {
        return 'single'
    }

    const allowsRepeat = group.options.some((option) => option.maxQuantity !== 1)
    const kind = allowsRepeat ? 'quantity' : 'multiple'
    return kind
}

export function countGroupUnits(group: OptionGroup, selection: OptionSelection): number {
    const units = group.options.reduce((total, option) => total + (selection[option.id] ?? 0), 0)
    return units
}

export function isGroupSatisfied(group: OptionGroup, selection: OptionSelection): boolean {
    const units = countGroupUnits(group, selection)
    const reachesMinimum = units >= group.minChoices
    const respectsMaximum = group.maxChoices === null || units <= group.maxChoices

    const isSatisfied = reachesMinimum && respectsMaximum
    return isSatisfied
}

// Até onde este opcional pode subir sem estourar o próprio limite nem o do grupo.
export function getOptionCeiling(group: OptionGroup, option: ProductOption, selection: OptionSelection): number {
    const current = selection[option.id] ?? 0
    const unitsElsewhere = countGroupUnits(group, selection) - current
    const groupRoom = group.maxChoices === null ? Number.POSITIVE_INFINITY : group.maxChoices - unitsElsewhere

    const optionRoom = option.maxQuantity ?? Number.POSITIVE_INFINITY
    const ceiling = Math.max(0, Math.min(optionRoom, groupRoom))
    return ceiling
}

function withoutGroupOptions(group: OptionGroup, selection: OptionSelection): Record<string, number> {
    const groupOptionIds = new Set(group.options.map((option) => option.id))
    const remaining = Object.fromEntries(Object.entries(selection).filter(([optionId]) => !groupOptionIds.has(optionId)))
    return remaining
}

export function setOptionQuantity(
    group: OptionGroup,
    option: ProductOption,
    quantity: number,
    selection: OptionSelection,
): OptionSelection {
    const isSingle = getGroupInputKind(group) === 'single'
    const base = isSingle ? withoutGroupOptions(group, selection) : { ...selection }
    const ceiling = isSingle ? 1 : getOptionCeiling(group, option, selection)
    const clamped = Math.max(0, Math.min(quantity, ceiling))

    if (clamped === 0) {
        delete base[option.id]
        return base
    }

    const next = { ...base, [option.id]: clamped }
    return next
}

export function calculateUnitPriceCents(product: Product, selection: OptionSelection): number {
    const optionsTotal = product.optionGroups
        .flatMap((group) => group.options)
        .reduce((total, option) => total + option.priceCents * (selection[option.id] ?? 0), 0)

    const unitPrice = getEffectivePriceCents(product) + optionsTotal
    return unitPrice
}

export function findUnsatisfiedGroup(product: Product, selection: OptionSelection): OptionGroup | undefined {
    const unsatisfied = product.optionGroups.find((group) => !isGroupSatisfied(group, selection))
    return unsatisfied
}

function pluralizeOption(count: number): string {
    const word = count === 1 ? 'opção' : 'opções'
    return word
}

export function describeGroupRule(group: OptionGroup): string {
    const { minChoices, maxChoices } = group

    if (minChoices === 0 && maxChoices === null) {
        return 'Opcional'
    }
    if (minChoices === 0 && maxChoices !== null) {
        const upTo = `Escolha até ${maxChoices} ${pluralizeOption(maxChoices)}`
        return upTo
    }
    if (minChoices === maxChoices) {
        const exactly = `Escolha ${minChoices} ${pluralizeOption(minChoices)}`
        return exactly
    }
    if (maxChoices === null) {
        const atLeast = `Escolha pelo menos ${minChoices} ${pluralizeOption(minChoices)}`
        return atLeast
    }

    const range = `Escolha de ${minChoices} a ${maxChoices} opções`
    return range
}

export function toDraftOptions(product: Product, selection: OptionSelection): DraftLineOption[] {
    const draftOptions = product.optionGroups
        .flatMap((group) => group.options)
        .filter((option) => (selection[option.id] ?? 0) > 0)
        .map((option) => ({
            optionId: option.id,
            name: option.name,
            quantity: selection[option.id],
            priceCents: option.priceCents,
        }))
    return draftOptions
}
