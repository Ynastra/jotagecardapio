import { describe, expect, it } from 'vitest'

import type { Dashboard } from '@/pages/panel-home/model/dashboard'
import { buildDashboardScope, resolveDashboardView } from '@/pages/panel-home/model/dashboard-view'

const dashboard = { ordersCount: 3 } as Dashboard
const monthScope = buildDashboardScope('loja', 'America/Sao_Paulo', 'month')
const todayScope = buildDashboardScope('loja', 'America/Sao_Paulo', 'today')

describe('resolveDashboardView', () => {
    it('mostra carregamento na primeira carga', () => {
        const view = resolveDashboardView(null, null, monthScope)

        expect(view).toEqual({ status: 'loading', dashboard: null })
    })

    it('mostra o erro quando a primeira carga falha', () => {
        const view = resolveDashboardView(null, monthScope, monthScope)

        expect(view).toEqual({ status: 'failed', dashboard: null })
    })

    it('mantém os dados anteriores durante a releitura do mesmo escopo', () => {
        const view = resolveDashboardView({ scope: monthScope, dashboard }, null, monthScope)

        expect(view).toEqual({ status: 'ready', dashboard })
    })

    it('mantém os dados anteriores quando a releitura falha', () => {
        const view = resolveDashboardView({ scope: monthScope, dashboard }, monthScope, monthScope)

        expect(view).toEqual({ status: 'ready', dashboard })
    })

    it('volta ao carregamento na troca de período', () => {
        const view = resolveDashboardView({ scope: monthScope, dashboard }, null, todayScope)

        expect(view).toEqual({ status: 'loading', dashboard: null })
    })

    it('mostra o erro quando a busca da troca de período falha', () => {
        const view = resolveDashboardView({ scope: monthScope, dashboard }, todayScope, todayScope)

        expect(view).toEqual({ status: 'failed', dashboard: null })
    })
})
