import { Button } from '../button'
import { Sheet } from '../sheet'
import styles from './confirm-sheet.module.css'

type ConfirmSheetProps = {
    title: string
    message: string
    confirmLabel: string
    cancelLabel?: string
    isPending?: boolean
    onConfirm: () => void
    onClose: () => void
}

export function ConfirmSheet({
    title,
    message,
    confirmLabel,
    cancelLabel = 'Cancelar',
    isPending = false,
    onConfirm,
    onClose,
}: ConfirmSheetProps) {
    const footer = (
        <div className={styles.footer}>
            <Button variant="secondary" onClick={onClose}>
                {cancelLabel}
            </Button>
            <Button disabled={isPending} onClick={onConfirm}>
                {confirmLabel}
            </Button>
        </div>
    )

    return (
        <Sheet title={title} onClose={onClose} footer={footer}>
            <p className={styles.message}>{message}</p>
        </Sheet>
    )
}
