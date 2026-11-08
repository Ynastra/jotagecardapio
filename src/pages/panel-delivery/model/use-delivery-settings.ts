import { useCallback, useEffect, useState } from 'react'

import { fetchStoreSettings, updateStoreSettings, useReloadCurrentStore, type StoreSettings } from '@/entities/store'

import {
    formFromSettings,
    isDeliveryFormDirty,
    validateDeliveryForm,
    type DeliveryForm,
    type DeliveryFormErrors,
} from './delivery-form'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar a entrega. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export type DeliverySettingsStatus = 'loading' | 'ready' | 'failed'

export function useDeliverySettings(storeId: string) {
    const reloadCurrentStore = useReloadCurrentStore()
    const [status, setStatus] = useState<DeliverySettingsStatus>('loading')
    const [initial, setInitial] = useState<DeliveryForm | null>(null)
    const [form, setForm] = useState<DeliveryForm | null>(null)
    const [errors, setErrors] = useState<DeliveryFormErrors>({})
    const [isSaving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const applySettings = useCallback((settings: StoreSettings) => {
        const loaded = formFromSettings(settings)
        setInitial(loaded)
        setForm(loaded)
        setErrors({})
        setStatus('ready')
    }, [])

    useEffect(() => {
        let isCurrent = true

        fetchStoreSettings(storeId)
            .then((settings) => {
                if (isCurrent) {
                    applySettings(settings)
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar a entrega', error)
                if (isCurrent) {
                    setStatus('failed')
                    setErrorMessage(LOAD_FAILED_MESSAGE)
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, applySettings])

    function update(patch: Partial<DeliveryForm>) {
        setForm((current) => (current ? { ...current, ...patch } : current))
    }

    function discard() {
        setForm(initial)
        setErrors({})
    }

    async function save(activeZoneCount: number): Promise<boolean> {
        if (!form) {
            return false
        }

        const result = validateDeliveryForm(form, activeZoneCount)
        setErrors(result.errors)
        if (!result.value) {
            return false
        }

        setSaving(true)
        try {
            await updateStoreSettings(storeId, result.value)
            applySettings(await fetchStoreSettings(storeId))
            setErrorMessage(null)
        } catch (error) {
            console.error('Falha ao salvar a entrega', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return false
        } finally {
            setSaving(false)
        }

        await reloadCurrentStore().catch((error: unknown) => {
            console.error('Falha ao recarregar a loja depois de salvar', error)
        })
        return true
    }

    return {
        status,
        form,
        errors,
        isDirty: initial !== null && form !== null && isDeliveryFormDirty(initial, form),
        isSaving,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        update,
        discard,
        save,
    }
}
