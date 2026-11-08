import { useCallback, useEffect, useState } from 'react'

import { fetchMessages, saveMessages } from '../api/messages'
import type { WhatsappMessageType } from './message-types'
import {
    formFromStored,
    isMessagesFormDirty,
    validateMessagesForm,
    type MessageDraft,
    type MessagesForm,
    type MessagesFormErrors,
    type StoredMessage,
} from './messages-form'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar as mensagens. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export type MessagesStatus = 'loading' | 'ready' | 'failed'

export function useMessages(storeId: string) {
    const [status, setStatus] = useState<MessagesStatus>('loading')
    const [initial, setInitial] = useState<MessagesForm | null>(null)
    const [form, setForm] = useState<MessagesForm | null>(null)
    const [errors, setErrors] = useState<MessagesFormErrors>({})
    const [isSaving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const applyStored = useCallback((stored: readonly StoredMessage[]) => {
        const loaded = formFromStored(stored)
        setInitial(loaded)
        setForm(loaded)
        setErrors({})
        setStatus('ready')
    }, [])

    useEffect(() => {
        let isCurrent = true

        fetchMessages(storeId)
            .then((stored) => {
                if (isCurrent) {
                    applyStored(stored)
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar as mensagens do WhatsApp', error)
                if (isCurrent) {
                    setStatus('failed')
                    setErrorMessage(LOAD_FAILED_MESSAGE)
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, applyStored])

    function updateMessage(type: WhatsappMessageType, patch: Partial<MessageDraft>) {
        setForm((current) => {
            if (!current) {
                return current
            }

            const messages = { ...current.messages, [type]: { ...current.messages[type], ...patch } }
            return { ...current, messages }
        })
    }

    function updateInterval(greetingIntervalHours: string) {
        setForm((current) => (current ? { ...current, greetingIntervalHours } : current))
    }

    function discard() {
        setForm(initial)
        setErrors({})
    }

    async function save(): Promise<boolean> {
        if (!form) {
            return false
        }

        const result = validateMessagesForm(form)
        setErrors(result.errors)
        if (!result.value) {
            return false
        }

        setSaving(true)
        try {
            await saveMessages(storeId, result.value)
            applyStored(await fetchMessages(storeId))
            setErrorMessage(null)
        } catch (error) {
            console.error('Falha ao salvar as mensagens do WhatsApp', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return false
        } finally {
            setSaving(false)
        }
        return true
    }

    return {
        status,
        form,
        errors,
        isDirty: initial !== null && form !== null && isMessagesFormDirty(initial, form),
        isSaving,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        updateMessage,
        updateInterval,
        discard,
        save,
    }
}
