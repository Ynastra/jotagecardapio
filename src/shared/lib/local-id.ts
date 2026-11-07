const RANDOM_BASE = 36

// crypto.randomUUID só existe em contexto seguro (https ou localhost); no
// teste pelo celular na rede local a página roda em http e precisa da reserva.
export function createLocalId(): string {
    const hasRandomUuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    const fallback = `${Date.now().toString(RANDOM_BASE)}-${Math.random().toString(RANDOM_BASE).slice(2)}`

    const localId = hasRandomUuid ? crypto.randomUUID() : fallback
    return localId
}
