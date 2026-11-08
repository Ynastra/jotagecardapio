import { useEffect, useState } from 'react'

import { fetchSession } from '../api/session'
import type { StoredSession } from './connection'

export type SessionStatus = 'loading' | 'ready' | 'failed'

export function useSession(storeId: string) {
    const [status, setStatus] = useState<SessionStatus>('loading')
    const [session, setSession] = useState<StoredSession | null>(null)

    useEffect(() => {
        let isCurrent = true

        fetchSession(storeId)
            .then((loaded) => {
                if (isCurrent) {
                    setSession(loaded)
                    setStatus('ready')
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar a sessão do WhatsApp', error)
                if (isCurrent) {
                    setStatus('failed')
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId])

    return { status, session }
}
