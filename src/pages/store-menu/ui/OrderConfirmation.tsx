import { Link } from 'react-router-dom'

import { PixPayment, Sheet, StatusMessage, ThemeIcon, type PixKeyKind } from '@/shared/ui'

import styles from './order-confirmation.module.css'

type OrderConfirmationProps = {
    publicCode: string
    deadline: string
    trackingPath: string
    // null quando a loja não oferece o resumo pelo WhatsApp.
    whatsappUrl: string | null
    // null quando o pedido não é Pix ou a loja não tem chave cadastrada.
    pix: { totalCents: number; pixKey: string; pixKeyKind: PixKeyKind | null; receiptUrl: string } | null
    onClose: () => void
}

export function OrderConfirmation({ publicCode, deadline, trackingPath, whatsappUrl, pix, onClose }: OrderConfirmationProps) {
    return (
        <Sheet title="Pedido enviado" onClose={onClose}>
            <StatusMessage illustration="pedido-enviado" title={`Pedido ${publicCode}`}>
                <p className={styles.deadline}>{deadline}</p>
                <p>A loja já está vendo o seu pedido. Acompanhe o andamento pelo botão abaixo.</p>
            </StatusMessage>
            {pix ? (
                <div className={styles.pix}>
                    <PixPayment {...pix} />
                </div>
            ) : null}
            <div className={styles.actions}>
                <Link className={styles.primary} to={trackingPath}>
                    Acompanhar pedido
                </Link>
                {whatsappUrl ? (
                    <a className={styles.outline} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <ThemeIcon name="whatsapp" size={22} />
                        Enviar resumo no WhatsApp
                    </a>
                ) : null}
                <button type="button" className={styles.secondary} onClick={onClose}>
                    Voltar ao cardápio
                </button>
            </div>
        </Sheet>
    )
}
