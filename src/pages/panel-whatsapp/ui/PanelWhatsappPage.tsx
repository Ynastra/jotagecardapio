import { useEffect, useState } from 'react'

import { useCurrentStore } from '@/entities/store'
import { Button, StatusMessage } from '@/shared/ui'

import { MESSAGE_TYPES } from '../model/message-types'
import type { PreviewContext } from '../model/messages-form'
import { useMessages } from '../model/use-messages'
import { ConnectionSection } from './ConnectionSection'
import { MessageSection } from './MessageSection'
import styles from './panel-whatsapp.module.css'

export function PanelWhatsappPage() {
    const store = useCurrentStore()
    const messages = useMessages(store.id)
    const [isSaved, setSaved] = useState(false)

    useEffect(() => {
        document.title = `WhatsApp · ${store.name}`
    }, [store.name])

    useEffect(() => {
        if (!messages.isDirty) {
            return undefined
        }

        function warnBeforeUnload(event: BeforeUnloadEvent) {
            event.preventDefault()
        }

        window.addEventListener('beforeunload', warnBeforeUnload)
        return () => window.removeEventListener('beforeunload', warnBeforeUnload)
    }, [messages.isDirty])

    async function save() {
        setSaved(false)
        setSaved(await messages.save())
    }

    if (messages.status === 'failed') {
        return (
            <StatusMessage illustration="painel-sem-pedidos" title="Não deu para abrir WhatsApp">
                <p>{messages.errorMessage}</p>
            </StatusMessage>
        )
    }

    const { form, errors } = messages
    if (form === null) {
        return <p className={styles.muted}>Carregando mensagens</p>
    }

    const menuUrl = `${window.location.origin}/${store.slug}`
    const previewContext: PreviewContext = {
        storeName: store.name,
        menuUrl,
        exampleOrderUrl: `${menuUrl}/pedido/exemplo`,
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>WhatsApp</h1>

            <ConnectionSection storeId={store.id} timeZone={store.timezone} />

            {messages.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{messages.errorMessage}</p>
                    <Button variant="ghost" onClick={messages.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}

            <h2 className={styles.sectionTitle}>Mensagens</h2>
            {MESSAGE_TYPES.map((type) => (
                <MessageSection
                    key={type}
                    type={type}
                    draft={form.messages[type]}
                    error={errors[type]}
                    intervalHours={form.greetingIntervalHours}
                    intervalError={errors.greetingInterval}
                    previewContext={previewContext}
                    onChange={(patch) => messages.updateMessage(type, patch)}
                    onIntervalChange={messages.updateInterval}
                />
            ))}

            {messages.isDirty ? (
                <div className={styles.saveBar} role="region" aria-label="Alterações não salvas">
                    <strong>Alterações não salvas</strong>
                    <div className={styles.saveActions}>
                        <Button variant="secondary" onClick={messages.discard} disabled={messages.isSaving}>
                            Descartar
                        </Button>
                        <Button onClick={save} disabled={messages.isSaving}>
                            Salvar
                        </Button>
                    </div>
                </div>
            ) : null}
            {isSaved && !messages.isDirty ? <p role="status">Mensagens salvas</p> : null}
        </div>
    )
}
