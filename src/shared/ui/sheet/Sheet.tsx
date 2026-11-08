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
// O primeiro campo só recebe foco com ponteiro preciso: no toque, focar um campo
// abre o teclado e rola a folha antes de a pessoa pedir.
const FINE_POINTER_QUERY = '(pointer: fine)'

export function Sheet({ title, onClose, children, footer, hideTitle = false }: SheetProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
        dialog?.showModal()
        if (window.matchMedia(FINE_POINTER_QUERY).matches) {
            dialog?.querySelector<HTMLElement>(`.${styles.body} :is(input, select, textarea)`)?.focus()
        }
        return () => {
            dialog?.close()
            if (opener?.isConnected) {
                opener.focus()
            }
        }
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
