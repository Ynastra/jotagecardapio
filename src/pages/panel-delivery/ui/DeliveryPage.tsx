import { useEffect, useState } from 'react'

import { useCurrentStore } from '@/entities/store'
import { Button, StatusMessage } from '@/shared/ui'

import { useDeliverySettings } from '../model/use-delivery-settings'
import { useZones } from '../model/use-zones'
import { countActiveZones } from '../model/zones'
import styles from './delivery.module.css'
import { DeliveryFormSection } from './DeliveryFormSection'
import { ZonesSection } from './ZonesSection'

export function DeliveryPage() {
    const store = useCurrentStore()
    const settings = useDeliverySettings(store.id)
    const zonesState = useZones(store.id)
    const [isSaved, setSaved] = useState(false)

    useEffect(() => {
        document.title = `Entrega · ${store.name}`
    }, [store.name])

    useEffect(() => {
        if (!settings.isDirty) {
            return undefined
        }

        function warnBeforeUnload(event: BeforeUnloadEvent) {
            event.preventDefault()
        }

        window.addEventListener('beforeunload', warnBeforeUnload)
        return () => window.removeEventListener('beforeunload', warnBeforeUnload)
    }, [settings.isDirty])

    async function save() {
        setSaved(false)
        setSaved(await settings.save(countActiveZones(zonesState.zones)))
    }

    if (settings.status === 'failed') {
        return (
            <StatusMessage illustration="painel-sem-pedidos" title="Não deu para abrir Entrega">
                <p>{settings.errorMessage}</p>
            </StatusMessage>
        )
    }

    const { form, errors } = settings
    if (form === null) {
        return <p className={styles.muted}>Carregando a entrega</p>
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Entrega</h1>

            {settings.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{settings.errorMessage}</p>
                    <Button variant="ghost" onClick={settings.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}

            <DeliveryFormSection form={form} errors={errors} onChange={settings.update} />
            {form.mode === 'neighborhood' ? (
                <ZonesSection zonesState={zonesState} isNeighborhoodModeSaved={settings.savedMode === 'neighborhood'} />
            ) : null}

            {settings.isDirty ? (
                <div className={styles.saveBar} role="region" aria-label="Alterações não salvas">
                    <strong>Alterações não salvas</strong>
                    <div className={styles.saveActions}>
                        <Button variant="secondary" onClick={settings.discard} disabled={settings.isSaving}>
                            Descartar
                        </Button>
                        <Button onClick={save} disabled={settings.isSaving}>
                            Salvar
                        </Button>
                    </div>
                </div>
            ) : null}
            {isSaved && !settings.isDirty ? <p role="status">Entrega salva</p> : null}
        </div>
    )
}
