import type { Dashboard } from './dashboard'

export type DashboardStatus = 'loading' | 'ready' | 'failed'

export type LoadedDashboard = {
    scope: string
    dashboard: Dashboard
}

export type DashboardView = {
    status: DashboardStatus
    dashboard: Dashboard | null
}

export function buildDashboardScope(storeId: string, timeZone: string, periodKey: string): string {
    const scope = `${storeId}|${timeZone}|${periodKey}`
    return scope
}

// Os dados carregados continuam na tela enquanto uma nova busca do mesmo
// escopo roda ou falha; só a primeira carga e a troca de escopo mostram
// carregamento, e só nelas uma falha vira erro.
export function resolveDashboardView(
    loaded: LoadedDashboard | null,
    failedScope: string | null,
    scope: string,
): DashboardView {
    if (loaded !== null && loaded.scope === scope) {
        return { status: 'ready', dashboard: loaded.dashboard }
    }

    const status = failedScope === scope ? 'failed' : 'loading'
    return { status, dashboard: null }
}
