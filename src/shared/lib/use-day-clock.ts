import { useEffect, useState } from 'react'

import { getNextDayStart } from './zoned-time'

const MIDNIGHT_MARGIN_MS = 1000

// O relógio acompanha o fuso da loja: vira na meia-noite dela e é relido quando
// a aba volta a ficar visível, já que o navegador pode ter adiado o timer com a
// aba em segundo plano.
export function useDayClock(timeZone: string): Date {
    const [now, setNow] = useState(() => new Date())
    const nowMs = now.getTime()

    useEffect(() => {
        const msUntilNextDay = getNextDayStart(new Date(nowMs), timeZone).getTime() - Date.now()
        const timer = window.setTimeout(() => setNow(new Date()), Math.max(msUntilNextDay, 0) + MIDNIGHT_MARGIN_MS)
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

    return now
}
