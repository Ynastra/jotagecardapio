import { useState } from 'react'

import { Button, ConfirmSheet } from '@/shared/ui'

import { describeConnection, qrImageSource, type ConnectionState } from '../model/connection'
import { useSession } from '../model/use-session'
import styles from './panel-whatsapp.module.css'

const RISK_NOTICE =
    'A conexão por QR code funciona como um aparelho conectado, do mesmo jeito que o WhatsApp Web. Não é a forma oficial do WhatsApp, e o número da loja pode sofrer restrições ou ser bloqueado.'

const QR_INSTRUCTION =
    'No celular da loja, abra o WhatsApp, toque em Dispositivos conectados e depois em Conectar dispositivo. Aponte a câmera para este código.'

const GATEWAY_DOWN_MESSAGE = 'Não deu para falar com o servidor do WhatsApp. Tente de novo em instantes.'

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
    const { status, session, qr, isGatewayDown, isBusy, connect, disconnect } = useSession(storeId)
    const [isConfirmingDisconnect, setConfirmingDisconnect] = useState(false)
    const view = describeConnection(session, timeZone)
    const qrSource = qrImageSource(qr)

    async function confirmDisconnect() {
        await disconnect()
        setConfirmingDisconnect(false)
    }

    return (
        <section className={styles.section} aria-label="Conexão">
            <h2 className={styles.sectionTitle}>Conexão</h2>

            {status === 'loading' ? (
                <p className={styles.hint} role="status">
                    Lendo o estado da conexão...
                </p>
            ) : null}

            {status === 'failed' ? (
                <p className={styles.fieldError} role="alert">
                    Não deu para ler o estado da conexão. Confira a internet.
                </p>
            ) : null}

            {status === 'ready' ? (
                <div className={styles.stateRow}>
                    <span className={BADGE_CLASS[view.state]}>{view.label}</span>
                    {view.phoneText ? <span>{view.phoneText}</span> : null}
                    {view.updatedAtText ? <span className={styles.hint}>Atualizado em {view.updatedAtText}</span> : null}
                </div>
            ) : null}

            {isGatewayDown ? (
                <p className={styles.fieldError} role="alert">
                    {GATEWAY_DOWN_MESSAGE}
                </p>
            ) : null}

            {status === 'ready' && view.state === 'connecting' ? (
                <div className={styles.qrBlock}>
                    {qrSource ? (
                        <img className={styles.qrImage} src={qrSource} alt="QR code para conectar o WhatsApp da loja" />
                    ) : (
                        <p className={styles.qrWaiting} role="status">
                            Gerando o QR code...
                        </p>
                    )}
                    <p className={styles.qrInstruction}>{QR_INSTRUCTION}</p>
                    <Button variant="secondary" onClick={disconnect} disabled={isBusy}>
                        Cancelar
                    </Button>
                </div>
            ) : null}

            <p className={styles.riskNotice}>{RISK_NOTICE}</p>

            {status === 'ready' && view.state === 'disconnected' ? (
                <div className={styles.actions}>
                    <Button onClick={connect} disabled={isBusy}>
                        Conectar por QR code
                    </Button>
                </div>
            ) : null}

            {status === 'ready' && view.state === 'connected' ? (
                <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => setConfirmingDisconnect(true)} disabled={isBusy}>
                        Desconectar
                    </Button>
                </div>
            ) : null}

            <p className={styles.hint}>
                O botão do WhatsApp na gaveta do pedido, em Pedidos, continua disponível como alternativa ao envio automático.
            </p>

            {isConfirmingDisconnect ? (
                <ConfirmSheet
                    title="Desconectar o WhatsApp"
                    message="A loja deixa de avisar os clientes sozinha. O aparelho sai de Dispositivos conectados e você pode conectar de novo por QR code."
                    confirmLabel="Desconectar"
                    isPending={isBusy}
                    onConfirm={confirmDisconnect}
                    onClose={() => setConfirmingDisconnect(false)}
                />
            ) : null}
        </section>
    )
}
