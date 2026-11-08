import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchSession, runSessionAction } from '../api/session'
import { sessionFromSnapshot, shouldPollSession, type GatewaySnapshot, type StoredSession } from './connection'

export type SessionStatus = 'loading' | 'ready' | 'failed'

const POLL_INTERVAL_MS = 3000

export function useSession(storeId: string) {
    const [status, setStatus] = useState<SessionStatus>('loading')
    const [session, setSession] = useState<StoredSession | null>(null)
    const [qr, setQr] = useState<string | null>(null)
    const [isGatewayDown, setGatewayDown] = useState(false)
    const [isBusy, setBusy] = useState(false)
    const actionGenerationRef = useRef(0)

    const applySnapshot = useCallback((snapshot: GatewaySnapshot) => {
        setSession(sessionFromSnapshot(snapshot, new Date().toISOString()))
        setQr(snapshot.qr)
        setGatewayDown(false)
        setStatus('ready')
    }, [])

    useEffect(() => {
        let isCurrent = true

        async function load() {
            try {
                const snapshot = await runSessionAction('status', storeId)
                if (isCurrent) {
                    applySnapshot(snapshot)
                }
            } catch (gatewayError: unknown) {
                console.error('Falha ao sincronizar a sessão do WhatsApp', gatewayError)
                await loadStoredSession()
            }
        }

        async function loadStoredSession() {
            try {
                const stored = await fetchSession(storeId)
                if (isCurrent) {
                    setSession(stored)
                    setGatewayDown(true)
                    setStatus('ready')
                }
            } catch (storedError: unknown) {
                console.error('Falha ao carregar a sessão do WhatsApp', storedError)
                if (isCurrent) {
                    setStatus('failed')
                }
            }
        }

        void load()

        return () => {
            isCurrent = false
        }
    }, [storeId, applySnapshot])

    const state = session?.state ?? 'disconnected'
    const isPolling = shouldPollSession(state)

    useEffect(() => {
        if (!isPolling) {
            return undefined
        }

        let isCurrent = true
        let timer: number | undefined

        async function poll() {
            const generation = actionGenerationRef.current
            try {
                const snapshot = await runSessionAction('status', storeId)
                if (isCurrent && generation === actionGenerationRef.current) {
                    applySnapshot(snapshot)
                }
            } catch (error: unknown) {
                console.error('Falha ao consultar a sessão do WhatsApp', error)
                if (isCurrent && generation === actionGenerationRef.current) {
                    setGatewayDown(true)
                }
            }

            if (isCurrent) {
                timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS)
            }
        }

        timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS)

        return () => {
            isCurrent = false
            window.clearTimeout(timer)
        }
    }, [isPolling, storeId, applySnapshot])

    async function runAction(action: 'connect' | 'disconnect') {
        actionGenerationRef.current += 1
        setBusy(true)
        try {
            const snapshot = await runSessionAction(action, storeId)
            applySnapshot(snapshot)
        } catch (error: unknown) {
            console.error('Falha na ação da sessão do WhatsApp', error)
            setGatewayDown(true)
        } finally {
            setBusy(false)
        }
    }

    const connect = () => runAction('connect')
    const disconnect = () => runAction('disconnect')

    return { status, session, qr, isGatewayDown, isBusy, connect, disconnect }
}
