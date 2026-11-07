import type { OrderLineOption } from '@/entities/order'

export type OptionGroupSummary = {
    title: string
    choices: string
}

// Agrupa as escolhas de um item pelo título do grupo, na ordem em que aparecem.
export function summarizeOptionGroups(options: readonly OrderLineOption[]): OptionGroupSummary[] {
    const choicesByTitle = new Map<string, string[]>()

    for (const option of options) {
        const quantityPrefix = option.quantity > 1 ? `${option.quantity}x ` : ''
        const choices = choicesByTitle.get(option.groupTitle) ?? []
        choices.push(`${quantityPrefix}${option.name}`)
        choicesByTitle.set(option.groupTitle, choices)
    }

    const summaries = Array.from(choicesByTitle, ([title, choices]) => ({ title, choices: choices.join(', ') }))
    return summaries
}
