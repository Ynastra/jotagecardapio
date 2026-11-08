import { formatCents } from '@/shared/lib'

// "Troco para R$ 100,00, levar R$ 58,02"; nulo quando não há troco a levar.
export function describeChangeNote(changeForCents: number | null, totalCents: number): string | null {
    if (changeForCents === null || changeForCents <= totalCents) {
        return null
    }

    const changeToBringCents = changeForCents - totalCents
    const note = `Troco para ${formatCents(changeForCents)}, levar ${formatCents(changeToBringCents)}`
    return note
}
