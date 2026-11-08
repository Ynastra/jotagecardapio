import { useEffect, useState } from 'react'

import { useCurrentStore } from '@/entities/store'
import { Button, StatusMessage } from '@/shared/ui'

import { usePaymentSettings } from '../model/use-payment-settings'
import { InPersonTab } from './InPersonTab'
import styles from './payment.module.css'

type TabKind = 'in-person' | 'online'

export function PaymentPage() {
    const store = useCurrentStore()
    const settings = usePaymentSettings(store.id)
    const [tab, setTab] = useState<TabKind>('in-person')
    const [isSaved, setSaved] = useState(false)

    useEffect(() => {
        document.title = `Pagamento · ${store.name}`
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
            <StatusMessage illustration="painel-sem-pedidos" title="Não deu para abrir Pagamento">
                <p>{settings.errorMessage}</p>
            </StatusMessage>
        )
    }

    const { form, errors } = settings
    if (form === null) {
        return <p className={styles.muted}>Carregando o pagamento</p>
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Pagamento</h1>

            <div className={styles.tabs} role="tablist" aria-label="Tipos de pagamento">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'in-person'}
                    className={tab === 'in-person' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                    onClick={() => setTab('in-person')}
                >
                    Presencial
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'online'}
                    className={tab === 'online' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                    onClick={() => setTab('online')}
                >
                    Online
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

            {tab === 'in-person' ? (
                <InPersonTab form={form} errors={errors} onChange={settings.update} />
            ) : (
                <section className={styles.soon} aria-label="Pagamento online">
                    <span className={styles.soonBadge}>Em breve</span>
                    <p>Em breve o cliente poderá pagar pelo próprio cardápio, sem combinar nada pelo WhatsApp.</p>
                </section>
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
            {isSaved && !settings.isDirty ? <p role="status">Pagamento salvo</p> : null}
        </div>
    )
}
