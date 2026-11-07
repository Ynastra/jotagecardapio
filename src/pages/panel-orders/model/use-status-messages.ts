import { useEffect, useState } from 'react'

import type { StoredStatusMessage } from '@/entities/order'

import { fetchStatusMessages } from '../api/fetch-status-messages'

// Sem leitura (ainda carregando ou com falha) vale o texto padrão de cada status.
export function useStatusMessages(storeId: string): StoredStatusMessage[] {
    const [messages, setMessages] = useState<StoredStatusMessage[]>([])

    useEffect(() => {
        let isCurrent = true

        fetchStatusMessages(storeId)
            .then((loaded) => {
                if (isCurrent) {
                    setMessages(loaded)
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar mensagens de status', error)
            })

        return () => {
            isCurrent = false
        }
    }, [storeId])

    return messages
}
