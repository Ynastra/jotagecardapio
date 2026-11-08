import { Button } from '@/shared/ui'

import { describeConnection, type ConnectionState } from '../model/connection'
import { useSession } from '../model/use-session'
import styles from './panel-whatsapp.module.css'

const RISK_NOTICE =
    'A conexão por QR code funciona como um aparelho conectado, do mesmo jeito que o WhatsApp Web. Não é a forma oficial do WhatsApp, e o número da loja pode sofrer restrições ou ser bloqueado.'

const BADGE_CLASS: Record<ConnectionState, string> = {
    connected: `${styles.stateBadge} ${styles.stateConnected}`,
    connecting: `${styles.stateBadge} ${styles.stateConnecting}`,
    disconnected: styles.stateBadge,
}

type ConnectionSectionProps = {
    storeId: string
    timeZone: string
}

export function ConnectionSection({ storeId, timeZone }: ConnectionSectionProps) {
    const { status, session } = useSession(storeId)
    const view = describeConnection(session, timeZone)

    return (
        <section className={styles.section} aria-label="Conexão">
            <h2 className={styles.sectionTitle}>Conexão</h2>

            {status === 'failed' ? (
                <p className={styles.fieldError} role="alert">
                    Não deu para ler o estado da conexão. Confira a internet.
                </p>
            ) : (
                <div className={styles.stateRow}>
                    <span className={BADGE_CLASS[view.state]}>{view.label}</span>
                    {view.phoneText ? <span>{view.phoneText}</span> : null}
                    {view.updatedAtText ? <span className={styles.hint}>Atualizado em {view.updatedAtText}</span> : null}
                </div>
            )}

            <p className={styles.riskNotice}>{RISK_NOTICE}</p>

            <div className={styles.actions}>
                <Button variant="secondary" disabled>
                    Conectar por QR code
                </Button>
                <span className={styles.hint}>Em breve</span>
            </div>

            <p className={styles.hint}>
                Enquanto a conexão não está pronta, as mensagens de status são enviadas pelo botão do WhatsApp na gaveta do
                pedido, em Pedidos.
            </p>
        </section>
    )
}
