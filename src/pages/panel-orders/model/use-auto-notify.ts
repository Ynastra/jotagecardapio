import { useCallback, useEffect, useRef, useState } from 'react'

import type { PanelOrder } from '@/entities/order'

import { fetchWhatsappSessionState, sendWhatsappMessage } from '../api/whatsapp-send'
import { AUTO_NOTIFY_FAILED_MESSAGE, AUTO_NOTIFY_SENT_MESSAGE, shouldSendAutomatically } from './auto-notify'

const NOTICE_DURATION_MS = 6000

export type AutoNotify = {
    notice: string | null
    notifyCustomer: (order: PanelOrder) => void
}

export function useAutoNotify(storeId: string, buildMessage: (order: PanelOrder) => string | null): AutoNotify {
    const [notice, setNotice] = useState<string | null>(null)
    const timerRef = useRef<number | null>(null)

    const showNotice = useCallback((message: string) => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current)
        }
        setNotice(message)
        timerRef.current = window.setTimeout(() => setNotice(null), NOTICE_DURATION_MS)
    }, [])

    useEffect(
        () => () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current)
            }
        },
        [],
    )

    const notifyCustomer = useCallback(
        (order: PanelOrder) => {
            let message: string | null
            try {
                message = buildMessage(order)
            } catch (error: unknown) {
                console.error('Falha ao montar o aviso ao cliente', error)
                showNotice(AUTO_NOTIFY_FAILED_MESSAGE)
                return
            }
            if (message === null) {
                return
            }

            async function send(text: string) {
                try {
                    const sessionState = await fetchWhatsappSessionState(storeId)
                    if (!shouldSendAutomatically(sessionState, text)) {
                        return
                    }

                    await sendWhatsappMessage(storeId, order.id, text)
                    showNotice(AUTO_NOTIFY_SENT_MESSAGE)
                } catch (error: unknown) {
                    console.error('Falha ao avisar o cliente no WhatsApp', error)
                    showNotice(AUTO_NOTIFY_FAILED_MESSAGE)
                }
            }

            void send(message)
        },
        [storeId, buildMessage, showNotice],
    )

    return { notice, notifyCustomer }
}
