import { Button, Sheet } from '@/shared/ui'

import styles from './products.module.css'

type ConfirmSheetProps = {
    title: string
    message: string
    confirmLabel: string
    isPending: boolean
    onConfirm: () => void
    onClose: () => void
}

export function ConfirmSheet({ title, message, confirmLabel, isPending, onConfirm, onClose }: ConfirmSheetProps) {
    const footer = (
        <div className={styles.sheetFooter}>
            <Button variant="secondary" onClick={onClose}>
                Cancelar
            </Button>
            <Button disabled={isPending} onClick={onConfirm}>
                {confirmLabel}
            </Button>
        </div>
    )

    return (
        <Sheet title={title} onClose={onClose} footer={footer}>
            <p className={styles.confirmText}>{message}</p>
        </Sheet>
    )
}
