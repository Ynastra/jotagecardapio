import { useMemo } from 'react'

import { useDayClock } from '@/shared/lib'

import { getPeriodStart, type PeriodKey } from './period'

export function usePeriodStart(period: PeriodKey, timeZone: string): Date {
    const now = useDayClock(timeZone)
    const nowMs = now.getTime()

    const periodStart = useMemo(() => getPeriodStart(period, new Date(nowMs), timeZone), [period, nowMs, timeZone])
    return periodStart
}
