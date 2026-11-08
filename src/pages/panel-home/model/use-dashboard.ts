import { useEffect, useState } from 'react'

import { useDayClock } from '@/shared/lib'

import { fetchDashboard } from '../api/fetch-dashboard'
import { buildDashboardScope, resolveDashboardView, type LoadedDashboard } from './dashboard-view'
import { DEFAULT_HOME_PERIOD, getHomePeriodRange, type HomePeriodKey } from './home-period'

export function useDashboard(storeId: string, timeZone: string) {
    const [period, setPeriod] = useState<HomePeriodKey>(DEFAULT_HOME_PERIOD)
    const [loaded, setLoaded] = useState<LoadedDashboard | null>(null)
    const [failedScope, setFailedScope] = useState<string | null>(null)
    const [attempt, setAttempt] = useState(0)
    const now = useDayClock(timeZone)
    const nowMs = now.getTime()
    const scope = buildDashboardScope(storeId, timeZone, period)

    useEffect(() => {
        let isCurrent = true
        const range = getHomePeriodRange(period, new Date(nowMs), timeZone)
        setFailedScope(null)

        fetchDashboard(storeId, range)
            .then((dashboard) => {
                if (isCurrent) {
                    setLoaded({ scope, dashboard })
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar o início do painel', error)
                if (isCurrent) {
                    setFailedScope(scope)
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, timeZone, period, scope, nowMs, attempt])

    function retry() {
        setAttempt((current) => current + 1)
    }

    const { status, dashboard } = resolveDashboardView(loaded, failedScope, scope)

    return { period, setPeriod, status, dashboard, retry }
}
