export const GROUP_TITLE_MAX = 120
export const GROUP_DESCRIPTION_MAX = 200
export const OPTION_NAME_MAX = 120
export const OPTION_DESCRIPTION_MAX = 200

export type AddonOption = {
    id: string
    groupId: string
    name: string
    description: string | null
    imageUrl: string | null
    priceCents: number
    maxQuantity: number | null
    position: number
    active: boolean
}

export type AddonGroup = {
    id: string
    title: string
    description: string | null
    active: boolean
    position: number
    options: AddonOption[]
    productCount: number
}

export function sortByPosition<Item extends { position: number }>(items: readonly Item[]): Item[] {
    const sorted = [...items].sort((first, second) => first.position - second.position)
    return sorted
}

function normalizeSearchText(text: string): string {
    const withoutAccents = text.normalize('NFD').replace(/[̀-ͯ]/g, '')
    const normalized = withoutAccents.toLowerCase().trim()
    return normalized
}

// O grupo que casa pelo título mostra todos os itens; o que casa só por itens
// mostra apenas os itens encontrados.
export function filterGroupsBySearch(groups: readonly AddonGroup[], search: string): AddonGroup[] {
    const term = normalizeSearchText(search)
    if (term === '') {
        return [...groups]
    }

    const filtered: AddonGroup[] = []
    for (const group of groups) {
        if (normalizeSearchText(group.title).includes(term)) {
            filtered.push(group)
            continue
        }

        const matchingOptions = group.options.filter((option) => normalizeSearchText(option.name).includes(term))
        if (matchingOptions.length > 0) {
            filtered.push({ ...group, options: matchingOptions })
        }
    }
    return filtered
}

export function describeUsage(productCount: number): string | null {
    if (productCount === 0) {
        return null
    }

    const noun = productCount === 1 ? 'produto' : 'produtos'
    const description = `Usado em ${productCount} ${noun}`
    return description
}

export function describeItemCount(itemCount: number): string {
    const noun = itemCount === 1 ? 'item' : 'itens'
    const description = `${itemCount} ${noun}`
    return description
}
