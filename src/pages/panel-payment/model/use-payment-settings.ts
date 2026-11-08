import { useCallback, useEffect, useState } from 'react'

import { fetchStoreSettings, updateStoreSettings } from '@/entities/store'

import { fetchMethodRules, saveMethodRules } from '../api/payment-methods'
import {
    formFromData,
    isPaymentFormDirty,
    validatePaymentForm,
    type Fulfillments,
    type PaymentForm,
    type PaymentFormErrors,
} from './payment-form'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar o pagamento. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

const NO_ERRORS: PaymentFormErrors = { fees: {} }

export type PaymentSettingsStatus = 'loading' | 'ready' | 'failed'

export function usePaymentSettings(storeId: string) {
    const [status, setStatus] = useState<PaymentSettingsStatus>('loading')
    const [accepts, setAccepts] = useState<Fulfillments>({ acceptsDelivery: true, acceptsPickup: true })
    const [initial, setInitial] = useState<PaymentForm | null>(null)
    const [form, setForm] = useState<PaymentForm | null>(null)
    const [errors, setErrors] = useState<PaymentFormErrors>(NO_ERRORS)
    const [isSaving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const load = useCallback(async () => {
        const [settings, rules] = await Promise.all([fetchStoreSettings(storeId), fetchMethodRules(storeId)])
        const loaded = formFromData(rules, settings)
        setAccepts({ acceptsDelivery: settings.acceptsDelivery, acceptsPickup: settings.acceptsPickup })
        setInitial(loaded)
        setForm(loaded)
        setErrors(NO_ERRORS)
        setStatus('ready')
    }, [storeId])

    useEffect(() => {
        let isCurrent = true

        load().catch((error: unknown) => {
            console.error('Falha ao carregar o pagamento', error)
            if (isCurrent) {
                setStatus('failed')
                setErrorMessage(LOAD_FAILED_MESSAGE)
            }
        })

        return () => {
            isCurrent = false
        }
    }, [load])

    function update(change: (current: PaymentForm) => PaymentForm) {
        setForm((current) => (current ? change(current) : current))
    }

    function discard() {
        setForm(initial)
        setErrors(NO_ERRORS)
    }

    async function save(): Promise<boolean> {
        if (!form) {
            return false
        }

        const result = validatePaymentForm(form, accepts)
        setErrors(result.errors)
        if (!result.value) {
            return false
        }

        setSaving(true)
        try {
            await saveMethodRules(storeId, result.value.rules)
            await updateStoreSettings(storeId, result.value.pix)
            await load()
            setErrorMessage(null)
            return true
        } catch (error) {
            console.error('Falha ao salvar o pagamento', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return false
        } finally {
            setSaving(false)
        }
    }

    return {
        status,
        form,
        errors,
        isDirty: initial !== null && form !== null && isPaymentFormDirty(initial, form),
        isSaving,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        update,
        discard,
        save,
    }
}
