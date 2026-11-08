import { useRef } from 'react'

import { ActiveSwitch, Button } from '@/shared/ui'

import {
    BODY_MAX,
    DEFAULT_INTERVAL_HOURS,
    DEFAULT_MESSAGES,
    INTERVAL_MAX_HOURS,
    INTERVAL_MIN_HOURS,
    MESSAGE_TIMINGS,
    MESSAGE_TITLES,
    VARIABLES_BY_TYPE,
    type WhatsappMessageType,
} from '../model/message-types'
import {
    buildMessagePreview,
    insertAtCursor,
    type MessageDraft,
    type PreviewContext,
} from '../model/messages-form'
import styles from './panel-whatsapp.module.css'

type MessageSectionProps = {
    type: WhatsappMessageType
    draft: MessageDraft
    error: string | undefined
    intervalHours: string
    intervalError: string | undefined
    previewContext: PreviewContext
    onChange: (patch: Partial<MessageDraft>) => void
    onIntervalChange: (hours: string) => void
}

function FieldError({ message }: { message: string | undefined }) {
    return message ? <span className={styles.fieldError}>{message}</span> : null
}

export function MessageSection({
    type,
    draft,
    error,
    intervalHours,
    intervalError,
    previewContext,
    onChange,
    onIntervalChange,
}: MessageSectionProps) {
    const bodyRef = useRef<HTMLTextAreaElement>(null)
    const title = MESSAGE_TITLES[type]
    const preview = buildMessagePreview(type, draft.customBody, previewContext)

    function insertVariable(variable: string) {
        const field = bodyRef.current
        const start = field?.selectionStart ?? draft.customBody.length
        const end = field?.selectionEnd ?? start
        const inserted = insertAtCursor(draft.customBody, `{${variable}}`, start, end)

        onChange({ customBody: inserted.text })
        window.requestAnimationFrame(() => {
            field?.focus()
            field?.setSelectionRange(inserted.caret, inserted.caret)
        })
    }

    return (
        <section className={styles.section} aria-label={title}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{title}</h3>
                <ActiveSwitch
                    label={`${title}: enviar mensagem`}
                    checked={draft.isActive}
                    onChange={(isActive) => onChange({ isActive })}
                />
            </div>
            <p className={styles.hint}>{MESSAGE_TIMINGS[type]}</p>

            <label className={styles.field}>
                Mensagem personalizada
                <textarea
                    ref={bodyRef}
                    rows={4}
                    value={draft.customBody}
                    placeholder={DEFAULT_MESSAGES[type]}
                    aria-invalid={error !== undefined}
                    onChange={(event) => onChange({ customBody: event.target.value })}
                />
                <span className={styles.counter}>
                    {draft.customBody.length}/{BODY_MAX}
                </span>
                <FieldError message={error} />
            </label>

            <div className={styles.chips} role="group" aria-label={`Variáveis de ${title}`}>
                {VARIABLES_BY_TYPE[type].map((variable) => (
                    <button key={variable} type="button" className={styles.chip} onClick={() => insertVariable(variable)}>
                        {`{${variable}}`}
                    </button>
                ))}
            </div>

            <div className={styles.actions}>
                <Button variant="secondary" onClick={() => onChange({ customBody: '' })}>
                    Usar texto padrão
                </Button>
            </div>

            {type === 'greeting' ? (
                <label className={styles.field}>
                    Intervalo entre saudações (horas)
                    <input
                        type="number"
                        inputMode="numeric"
                        min={INTERVAL_MIN_HOURS}
                        max={INTERVAL_MAX_HOURS}
                        value={intervalHours}
                        placeholder={String(DEFAULT_INTERVAL_HOURS)}
                        aria-invalid={intervalError !== undefined}
                        onChange={(event) => onIntervalChange(event.target.value)}
                    />
                    <span className={styles.hint}>Vazio usa o padrão de {DEFAULT_INTERVAL_HOURS} horas.</span>
                    <FieldError message={intervalError} />
                </label>
            ) : null}

            <div>
                <span className={styles.previewLabel}>Prévia</span>
                <p className={styles.bubble}>{preview}</p>
            </div>
        </section>
    )
}
