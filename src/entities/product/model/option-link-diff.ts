import type { ProductOptionLink } from './types'

export type OptionLinkDiff = {
    // Vínculos novos ou com posição, mínimo ou máximo diferentes.
    upserts: ProductOptionLink[]
    removedGroupIds: string[]
}

function isSameLink(first: ProductOptionLink, second: ProductOptionLink): boolean {
    const isSame =
        first.position === second.position &&
        first.minChoices === second.minChoices &&
        first.maxChoices === second.maxChoices
    return isSame
}

export function diffOptionLinks(
    current: readonly ProductOptionLink[],
    desired: readonly ProductOptionLink[],
): OptionLinkDiff {
    const currentByGroup = new Map(current.map((link) => [link.groupId, link]))
    const desiredGroupIds = new Set(desired.map((link) => link.groupId))

    const upserts = desired.filter((link) => {
        const existing = currentByGroup.get(link.groupId)
        const needsWrite = existing === undefined || !isSameLink(existing, link)
        return needsWrite
    })
    const removedGroupIds = current.map((link) => link.groupId).filter((groupId) => !desiredGroupIds.has(groupId))

    const diff = { upserts, removedGroupIds }
    return diff
}
