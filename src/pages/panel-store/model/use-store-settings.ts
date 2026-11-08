import { useCallback, useEffect, useState } from 'react'

import { fetchStoreSettings, updateStoreSettings, useReloadCurrentStore, type StoreSettings } from '@/entities/store'

import {
    formFromSettings,
    isStoreFormDirty,
    validateFulfillment,
    validateStoreForm,
    type StoreForm,
    type StoreFormErrors,
} from './store-form'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar os dados da loja. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export type SettingsStatus = 'loading' | 'ready' | 'failed'

export function useStoreSettings(storeId: string) {
    const reloadCurrentStore = useReloadCurrentStore()
    const [status, setStatus] = useState<SettingsStatus>('loading')
    const [slug, setSlug] = useState('')
    const [initial, setInitial] = useState<StoreForm | null>(null)
    const [form, setForm] = useState<StoreForm | null>(null)
    const [errors, setErrors] = useState<StoreFormErrors>({})
    const [isSaving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const applySettings = useCallback((settings: StoreSettings) => {
        const loaded = formFromSettings(settings)
        setSlug(settings.slug)
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
                console.error('Falha ao carregar dados da loja', error)
                if (isCurrent) {
                    setStatus('failed')
                    setErrorMessage(LOAD_FAILED_MESSAGE)
                }
            })

        return () => {
            isCurrent = false
        }
    }, [storeId, applySettings])

    function update(patch: Partial<StoreForm>) {
        if (!form) {
            return
        }

        const next = { ...form, ...patch }
        setForm(next)

        const touchesFulfillment = 'acceptsDelivery' in patch || 'acceptsPickup' in patch
        if (touchesFulfillment) {
            setErrors((current) => ({ ...current, fulfillment: validateFulfillment(next) }))
        }
    }

    function discard() {
        setForm(initial)
        setErrors({})
    }

    async function save(): Promise<boolean> {
        if (!form) {
            return false
        }

        const result = validateStoreForm(form)
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
            console.error('Falha ao salvar dados da loja', error)
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
        slug,
        form,
        errors,
        isDirty: initial !== null && form !== null && isStoreFormDirty(initial, form),
        isSaving,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        update,
        discard,
        save,
    }
}

export type StoreSettingsEditor = ReturnType<typeof useStoreSettings>
