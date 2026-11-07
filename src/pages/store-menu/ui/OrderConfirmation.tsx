import { Sheet, StatusMessage, ThemeIcon } from '@/shared/ui'

import styles from './order-confirmation.module.css'

type OrderConfirmationProps = {
    orderNumber: number
    whatsappUrl: string
    onClose: () => void
}

export function OrderConfirmation({ orderNumber, whatsappUrl, onClose }: OrderConfirmationProps) {
    return (
        <Sheet title="Pedido enviado" onClose={onClose}>
            <StatusMessage illustration="pedido-enviado" title={`Pedido #${orderNumber} recebido`}>
                <p>A loja já está vendo o seu pedido. Mande o resumo no WhatsApp para combinar o que precisar com ela.</p>
            </StatusMessage>
            <div className={styles.actions}>
                <a className={styles.whatsapp} href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <ThemeIcon name="whatsapp" size={22} />
                    Enviar resumo no WhatsApp
                </a>
                <button type="button" className={styles.secondary} onClick={onClose}>
                    Voltar ao cardápio
                </button>
            </div>
        </Sheet>
    )
}
