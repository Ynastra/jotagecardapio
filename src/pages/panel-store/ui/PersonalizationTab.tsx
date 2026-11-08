import { isHexColor } from '@/shared/lib'
import { Button } from '@/shared/ui'

import {
    describeBrandColor,
    formatRatio,
    MIN_BRAND_ON_PAGE_CONTRAST,
    type StoreForm,
    type StoreFormErrors,
} from '../model/store-form'
import styles from './panel-store.module.css'
import { StoreImageField } from './StoreImageField'
import { HeaderPreview } from './StorePreviews'

const PICKER_FALLBACK_COLOR = '#000000'

type PersonalizationTabProps = {
    storeId: string
    form: StoreForm
    errors: StoreFormErrors
    onChange: (patch: Partial<StoreForm>) => void
}

export function PersonalizationTab({ storeId, form, errors, onChange }: PersonalizationTabProps) {
    const report = describeBrandColor(form.brandColor)
    const pickerValue = isHexColor(form.brandColor.trim()) ? form.brandColor.trim() : PICKER_FALLBACK_COLOR
    const legibility = report?.isTextReadable ? 'Boa legibilidade' : 'Legibilidade baixa'

    return (
        <div className={styles.layout}>
            <div className={styles.main}>
                <section className={styles.section} aria-label="Cor da marca">
                    <h2 className={styles.sectionTitle}>Cor da marca</h2>

                    <div className={styles.field}>
                        <label htmlFor="cor-da-marca">Cor</label>
                        <div className={styles.colorRow}>
                            <input
                                id="cor-da-marca"
                                type="text"
                                placeholder="#RRGGBB"
                                value={form.brandColor}
                                aria-invalid={errors.brandColor !== undefined}
                                onChange={(event) => onChange({ brandColor: event.target.value })}
                            />
                            <input
                                type="color"
                                aria-label="Escolher a cor no seletor"
                                value={pickerValue}
                                onChange={(event) => onChange({ brandColor: event.target.value })}
                            />
                            {form.brandColor ? (
                                <Button variant="ghost" onClick={() => onChange({ brandColor: '' })}>
                                    Usar a cor do tema
                                </Button>
                            ) : null}
                        </div>
                        {errors.brandColor ? <span className={styles.fieldError}>{errors.brandColor}</span> : null}
                        {form.brandColor ? null : (
                            <span className={styles.hint}>Vazio usa a cor padrão do tema.</span>
                        )}
                    </div>

                    {report ? (
                        <div>
                            <p className={report.isTextReadable ? styles.ratioGood : styles.ratioWarn} role="status">
                                <span className={styles.ratio}>
                                    {legibility} {formatRatio(report.textRatio)}
                                </span>{' '}
                                do texto sobre a cor
                            </p>
                            {report.isVisibleOnPage ? null : (
                                <p className={styles.ratioWarn}>
                                    A cor fica quase igual ao fundo da página ({formatRatio(report.pageRatio)}, o ideal é
                                    pelo menos {MIN_BRAND_ON_PAGE_CONTRAST}:1). Botões e destaques podem sumir.
                                </p>
                            )}
                        </div>
                    ) : null}
                </section>

                <section className={styles.section} aria-label="Logo e capa">
                    <h2 className={styles.sectionTitle}>Logo e capa</h2>
                    <StoreImageField
                        label="Logo"
                        previewClassName={styles.imagePreview}
                        storeId={storeId}
                        imageUrl={form.logoUrl}
                        onChange={(logoUrl) => onChange({ logoUrl })}
                    />
                    <StoreImageField
                        label="Capa"
                        previewClassName={styles.coverPreview}
                        storeId={storeId}
                        imageUrl={form.coverUrl}
                        onChange={(coverUrl) => onChange({ coverUrl })}
                    />
                </section>
            </div>

            <aside className={styles.preview} aria-label="Prévia do topo do cardápio">
                <HeaderPreview form={form} />
            </aside>
        </div>
    )
}
