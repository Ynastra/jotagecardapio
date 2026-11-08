import { useEffect, useState } from 'react'

import { useDayClock } from '@/shared/lib'

import { fetchDashboard } from '../api/fetch-dashboard'
import type { Dashboard } from './dashboard'
import { DEFAULT_HOME_PERIOD, getHomePeriodRange, type HomePeriodKey } from './home-period'

export type DashboardStatus = 'loading' | 'ready' | 'failed'

export function useDashboard(storeId: string, timeZone: string) {
    const [period, setPeriod] = useState<HomePeriodKey>(DEFAULT_HOME_PERIOD)
    const [status, setStatus] = useState<DashboardStatus>('loading')
    const [dashboard, setDashboard] = useState<Dashboard | null>(null)
    const [attempt, setAttempt] = useState(0)
    const now = useDayClock(timeZone)
    const nowMs = now.getTime()

    useEffect(() => {
        let isCurrent = true
        const range = getHomePeriodRange(period, new Date(nowMs), timeZone)
        setStatus('loading')

        fetchDashboard(storeId, range)
            .then((loaded) => {
                if (isCurrent) {
                    setDashboard(loaded)
                    setStatus('ready')
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar o início do painel', error)
                if (isCurrent) {
                    setStatus('failed')
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, timeZone, period, nowMs, attempt])

    function retry() {
        setAttempt((current) => current + 1)
    }

    return { period, setPeriod, status, dashboard, retry }
}
