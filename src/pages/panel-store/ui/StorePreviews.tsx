import { buildBrandStyle, isHexColor } from '@/shared/lib'
import { ThemeImage } from '@/shared/ui'

import type { StoreForm } from '../model/store-form'
import styles from './panel-store.module.css'

type PreviewProps = {
    form: StoreForm
}

export function HeaderPreview({ form }: PreviewProps) {
    const brandColor = form.brandColor.trim()
    const brandStyle = buildBrandStyle({ brandColor: isHexColor(brandColor) ? brandColor : null })
    const name = form.name.trim() || 'Nome da loja'

    return (
        <div className={styles.previewBlock}>
            <span className={styles.previewLabel}>Topo do cardápio</span>
            <div className={styles.previewFrame} style={brandStyle}>
                <ThemeImage className={styles.headerCover} src={form.coverUrl} fallbackStem="capa-padrao" alt="" />
                <div className={styles.headerCard}>
                    <ThemeImage
                        className={styles.headerLogo}
                        src={form.logoUrl}
                        fallbackStem="logo-padrao-loja"
                        alt=""
                    />
                    <div>
                        <strong className={styles.headerName}>{name}</strong>
                        <p>
                            <span className={styles.headerBadge}>Aberto agora</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function NoticePreview({ form }: PreviewProps) {
    const title = form.cartNoticeTitle.trim()
    const body = form.cartNoticeBody.trim()
    const hasNotice = title !== '' || body !== ''

    return (
        <div className={styles.previewBlock}>
            <span className={styles.previewLabel}>Recado no carrinho</span>
            <div className={styles.previewFrame}>
                {hasNotice ? (
                    <aside className={styles.notice}>
                        {title ? <strong className={styles.noticeTitle}>{title}</strong> : null}
                        {body ? <p>{body}</p> : null}
                    </aside>
                ) : (
                    <p className={styles.noticeEmpty}>Sem recado: nada aparece no carrinho.</p>
                )}
            </div>
        </div>
    )
}
