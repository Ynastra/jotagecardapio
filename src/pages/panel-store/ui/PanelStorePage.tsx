import { useEffect, useState } from 'react'

import { useCurrentStore } from '@/entities/store'
import { Button, StatusMessage } from '@/shared/ui'

import { useStoreSettings } from '../model/use-store-settings'
import { InfoTab } from './InfoTab'
import styles from './panel-store.module.css'
import { PersonalizationTab } from './PersonalizationTab'

type TabKind = 'info' | 'personalization'

export function PanelStorePage() {
    const store = useCurrentStore()
    const settings = useStoreSettings(store.id)
    const [tab, setTab] = useState<TabKind>('info')
    const [isSaved, setSaved] = useState(false)

    useEffect(() => {
        document.title = `Minha loja · ${store.name}`
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
        setSaved(await settings.save())
    }

    if (settings.status === 'failed') {
        return (
            <StatusMessage illustration="painel-sem-pedidos" title="Não deu para abrir Minha loja">
                <p>{settings.errorMessage}</p>
            </StatusMessage>
        )
    }

    const { form, errors } = settings
    if (form === null) {
        return <p className={styles.muted}>Carregando dados da loja</p>
    }

    const hasInfoError = Object.keys(errors).some((field) => field !== 'brandColor')
    const hasPersonalizationError = errors.brandColor !== undefined

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Minha loja</h1>

            <div className={styles.tabs} role="tablist" aria-label="Seções de Minha loja">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'info'}
                    className={tab === 'info' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                    onClick={() => setTab('info')}
                >
                    Informações{hasInfoError ? ' (revisar)' : ''}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'personalization'}
                    className={tab === 'personalization' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                    onClick={() => setTab('personalization')}
                >
                    Personalização{hasPersonalizationError ? ' (revisar)' : ''}
                </button>
            </div>

            {settings.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{settings.errorMessage}</p>
                    <Button variant="ghost" onClick={settings.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}

            {tab === 'info' ? (
                <InfoTab form={form} errors={errors} slug={settings.slug} onChange={settings.update} />
            ) : (
                <PersonalizationTab storeId={store.id} form={form} errors={errors} onChange={settings.update} />
            )}

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
            {isSaved && !settings.isDirty ? <p role="status">Dados da loja salvos</p> : null}
        </div>
    )
}
