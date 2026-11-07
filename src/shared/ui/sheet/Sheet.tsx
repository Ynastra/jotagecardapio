import { useEffect, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'

import { ThemeIcon } from '../theme-icon'
import styles from './sheet.module.css'

type SheetProps = {
    title: string
    onClose: () => void
    children: ReactNode
    footer?: ReactNode
    // Título só para leitor de tela, quando o conteúdo já mostra o nome.
    hideTitle?: boolean
}

// Folha que sobe do rodapé no celular e vira janela centralizada no desktop.
// Usa o <dialog> nativo para ganhar foco preso, Esc e fundo inerte.
export function Sheet({ title, onClose, children, footer, hideTitle = false }: SheetProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        dialog?.showModal()
        return () => dialog?.close()
    }, [])

    function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === dialogRef.current) {
            onClose()
        }
    }

    function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
        event.preventDefault()
        onClose()
    }

    return (
        <dialog
            ref={dialogRef}
            className={styles.sheet}
            aria-label={title}
            onCancel={handleCancel}
            onClick={handleBackdropClick}
        >
            <div className={styles.panel}>
                <header className={styles.header}>
                    <h2 className={hideTitle ? styles.hiddenTitle : styles.title}>{title}</h2>
                    <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
                        <ThemeIcon name="fechar" size={22} />
                    </button>
                </header>
                <div className={styles.body}>{children}</div>
                {footer ? <footer className={styles.footer}>{footer}</footer> : null}
            </div>
        </dialog>
    )
}
