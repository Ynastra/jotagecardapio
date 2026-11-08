import { sortByPosition } from './addon-group'

export type MoveDirection = 'up' | 'down'

export type PositionChange = { id: string; position: number }

// Reescreve a sequência inteira como 0, 1, 2...: assim posições repetidas ou
// com buracos se acertam no primeiro movimento. Devolve só o que mudou.
export function planMove(
    items: readonly { id: string; position: number }[],
    id: string,
    direction: MoveDirection,
): PositionChange[] {
    const sorted = sortByPosition(items)
    const index = sorted.findIndex((item) => item.id === id)
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) {
        return []
    }

    const reordered = [...sorted]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    const changes: PositionChange[] = []
    reordered.forEach((item, position) => {
        if (item.position !== position) {
            changes.push({ id: item.id, position })
        }
    })
    return changes
}

export function nextPosition(items: readonly { position: number }[]): number {
    if (items.length === 0) {
        return 0
    }

    const highest = Math.max(...items.map((item) => item.position))
    const next = highest + 1
    return next
}
