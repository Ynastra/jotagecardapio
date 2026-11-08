import { useEffect, useMemo, useState } from 'react'

import { getNextDayStart, getPeriodStart, type PeriodKey } from './period'

// O início do período acompanha o relógio: vira na meia-noite da loja e é
// relido quando a aba volta a ficar visível, já que o navegador pode ter
// adiado o timer com a aba em segundo plano.
export function usePeriodStart(period: PeriodKey, timeZone: string): Date {
    const [now, setNow] = useState(() => new Date())
    const nowMs = now.getTime()

    useEffect(() => {
        const msUntilNextDay = getNextDayStart(new Date(nowMs), timeZone).getTime() - Date.now()
        const timer = window.setTimeout(() => setNow(new Date()), Math.max(msUntilNextDay, 0) + 1000)
        return () => window.clearTimeout(timer)
    }, [nowMs, timeZone])

    useEffect(() => {
        function refreshWhenVisible() {
            if (document.visibilityState === 'visible') {
                setNow(new Date())
            }
        }

        document.addEventListener('visibilitychange', refreshWhenVisible)
        return () => document.removeEventListener('visibilitychange', refreshWhenVisible)
    }, [])

    const periodStart = useMemo(() => getPeriodStart(period, new Date(nowMs), timeZone), [period, nowMs, timeZone])
    return periodStart
}
