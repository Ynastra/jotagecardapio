import { useState } from 'react'

import { formatBrazilianPhone } from '@/shared/lib'
import { ActiveSwitch, Button } from '@/shared/ui'

import {
    ADDRESS_DISPLAY_LABELS,
    ADDRESS_MAX,
    BRAZILIAN_STATES,
    CITY_MAX,
    NAME_MAX,
    NOTICE_BODY_MAX,
    NOTICE_TITLE_MAX,
    type StoreForm,
    type StoreFormErrors,
} from '../model/store-form'
import styles from './panel-store.module.css'
import { NoticePreview } from './StorePreviews'

const COPIED_MESSAGE_MS = 2500

type InfoTabProps = {
    form: StoreForm
    errors: StoreFormErrors
    slug: string
    onChange: (patch: Partial<StoreForm>) => void
}

type ToggleField = 'acceptsDelivery' | 'acceptsPickup' | 'requireCep' | 'orderCopyWhatsapp'

const TOGGLES: readonly { field: ToggleField; label: string }[] = [
    { field: 'acceptsDelivery', label: 'Pedidos para entrega' },
    { field: 'acceptsPickup', label: 'Retirada de pedidos' },
    { field: 'requireCep', label: 'Exigir CEP' },
    { field: 'orderCopyWhatsapp', label: 'Cópia do pedido pelo WhatsApp' },
]

function FieldError({ message }: { message: string | undefined }) {
    return message ? <span className={styles.fieldError}>{message}</span> : null
}

export function InfoTab({ form, errors, slug, onChange }: InfoTabProps) {
    const [isCopied, setCopied] = useState(false)
    const menuUrl = `${window.location.origin}/${slug}`

    async function copyLink() {
        await navigator.clipboard.writeText(menuUrl)
        setCopied(true)
        window.setTimeout(() => setCopied(false), COPIED_MESSAGE_MS)
    }

    return (
        <div className={styles.layout}>
            <div className={styles.main}>
                <section className={styles.section} aria-label="Dados da loja">
                    <h2 className={styles.sectionTitle}>Dados</h2>

                    <label className={styles.field}>
                        Nome da loja
                        <input
                            value={form.name}
                            maxLength={NAME_MAX}
                            aria-invalid={errors.name !== undefined}
                            onChange={(event) => onChange({ name: event.target.value })}
                        />
                        <FieldError message={errors.name} />
                    </label>

                    <div className={styles.fieldRow}>
                        <label className={styles.field}>
                            WhatsApp
                            <input
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel-national"
                                value={form.whatsapp}
                                aria-invalid={errors.whatsapp !== undefined}
                                onChange={(event) => onChange({ whatsapp: formatBrazilianPhone(event.target.value) })}
                            />
                            <FieldError message={errors.whatsapp} />
                        </label>
                        <label className={styles.field}>
                            Pedido mínimo (R$)
                            <input
                                inputMode="decimal"
                                placeholder="0,00"
                                value={form.minOrderText}
                                aria-invalid={errors.minOrderText !== undefined}
                                onChange={(event) => onChange({ minOrderText: event.target.value })}
                            />
                            <FieldError message={errors.minOrderText} />
                        </label>
                    </div>

                    <label className={styles.field}>
                        Endereço
                        <input
                            value={form.address}
                            maxLength={ADDRESS_MAX}
                            aria-invalid={errors.address !== undefined}
                            onChange={(event) => onChange({ address: event.target.value })}
                        />
                        <FieldError message={errors.address} />
                    </label>

                    <div className={styles.fieldRow}>
                        <label className={styles.field}>
                            Cidade
                            <input
                                value={form.city}
                                maxLength={CITY_MAX}
                                aria-invalid={errors.city !== undefined}
                                onChange={(event) => onChange({ city: event.target.value })}
                            />
                            <FieldError message={errors.city} />
                        </label>
                        <label className={styles.field}>
                            UF
                            <select
                                value={form.state}
                                aria-invalid={errors.state !== undefined}
                                onChange={(event) => onChange({ state: event.target.value })}
                            >
                                <option value="">Sem UF</option>
                                {BRAZILIAN_STATES.map((state) => (
                                    <option key={state} value={state}>
                                        {state}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={errors.state} />
                        </label>
                    </div>

                    <label className={styles.field}>
                        Exibição do endereço no cardápio
                        <select
                            value={form.addressDisplay}
                            onChange={(event) =>
                                onChange({ addressDisplay: event.target.value as StoreForm['addressDisplay'] })
                            }
                        >
                            {Object.entries(ADDRESS_DISPLAY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className={styles.field}>
                        Link do cardápio
                        <div className={styles.linkRow}>
                            <span className={styles.linkText}>{menuUrl}</span>
                            <Button variant="secondary" onClick={copyLink}>
                                Copiar
                            </Button>
                            <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                                Abrir
                            </a>
                        </div>
                        <span className={styles.hint} role="status">
                            {isCopied ? 'Link copiado' : 'O endereço não muda, para não quebrar os links já divulgados.'}
                        </span>
                    </div>
                </section>

                <section className={styles.section} aria-label="Configurações da loja">
                    <h2 className={styles.sectionTitle}>Configurações</h2>

                    <ul className={styles.toggleList}>
                        {TOGGLES.map(({ field, label }) => (
                            <li key={field} className={styles.toggleRow}>
                                <span>{label}</span>
                                <ActiveSwitch
                                    label={label}
                                    checked={form[field]}
                                    onChange={(checked) => onChange({ [field]: checked })}
                                />
                            </li>
                        ))}
                    </ul>
                    <FieldError message={errors.fulfillment} />

                    <label className={styles.field}>
                        Itens indisponíveis
                        <select
                            value={form.hideUnavailableItems ? 'hide' : 'show'}
                            onChange={(event) => onChange({ hideUnavailableItems: event.target.value === 'hide' })}
                        >
                            <option value="hide">Ocultar do cardápio</option>
                            <option value="show">Mostrar como indisponível</option>
                        </select>
                    </label>
                </section>

                <section className={styles.section} aria-label="Recado no carrinho">
                    <h2 className={styles.sectionTitle}>Recado no carrinho</h2>
                    <p className={styles.hint}>Com título e texto vazios, o recado não aparece.</p>

                    <label className={styles.field}>
                        Título
                        <input
                            value={form.cartNoticeTitle}
                            maxLength={NOTICE_TITLE_MAX}
                            aria-invalid={errors.cartNoticeTitle !== undefined}
                            onChange={(event) => onChange({ cartNoticeTitle: event.target.value })}
                        />
                        <span className={styles.counter}>
                            {form.cartNoticeTitle.length}/{NOTICE_TITLE_MAX}
                        </span>
                        <FieldError message={errors.cartNoticeTitle} />
                    </label>

                    <label className={styles.field}>
                        Texto
                        <textarea
                            rows={4}
                            value={form.cartNoticeBody}
                            maxLength={NOTICE_BODY_MAX}
                            aria-invalid={errors.cartNoticeBody !== undefined}
                            onChange={(event) => onChange({ cartNoticeBody: event.target.value })}
                        />
                        <span className={styles.counter}>
                            {form.cartNoticeBody.length}/{NOTICE_BODY_MAX}
                        </span>
                        <FieldError message={errors.cartNoticeBody} />
                    </label>
                </section>
            </div>

            <aside className={styles.preview} aria-label="Prévia do recado">
                <NoticePreview form={form} />
            </aside>
        </div>
    )
}
