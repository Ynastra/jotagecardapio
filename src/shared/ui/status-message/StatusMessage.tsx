import type { ReactNode } from 'react'

import { useThemeAsset } from '@/shared/lib'

import styles from './status-message.module.css'

type StatusMessageProps = {
    // Nome do arquivo `estado-<ilustracao>.png` na pasta do tema.
    illustration: string
    title: string
    children?: ReactNode
}

export function StatusMessage({ illustration, title, children }: StatusMessageProps) {
    const illustrationUrl = useThemeAsset(`estado-${illustration}`)

    return (
        <section className={styles.status}>
            {illustrationUrl ? <img className={styles.illustration} src={illustrationUrl} alt="" /> : null}
            <h2 className={styles.title}>{title}</h2>
            {children ? <div className={styles.body}>{children}</div> : null}
        </section>
    )
}
