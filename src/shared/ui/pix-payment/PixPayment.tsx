import { useState } from 'react'

import { formatCents } from '@/shared/lib'

import { Button } from '../button'
import { ThemeIcon } from '../theme-icon'
import styles from './pix-payment.module.css'

export type PixKeyKind = 'cnpj' | 'cpf' | 'email' | 'phone' | 'random'

const KEY_LABELS: Record<PixKeyKind, string> = {
    cnpj: 'Chave CNPJ',
    cpf: 'Chave CPF',
    email: 'Chave e-mail',
    phone: 'Chave celular',
    random: 'Chave aleatória',
}

const DEFAULT_KEY_LABEL = 'Chave Pix'

type CopyState = 'idle' | 'copied' | 'failed'

type PixPaymentProps = {
    totalCents: number
    pixKey: string
    pixKeyKind: PixKeyKind | null
    receiptUrl: string
}

export function PixPayment({ totalCents, pixKey, pixKeyKind, receiptUrl }: PixPaymentProps) {
    const [copyState, setCopyState] = useState<CopyState>('idle')
    const keyLabel = pixKeyKind ? KEY_LABELS[pixKeyKind] : DEFAULT_KEY_LABEL

    async function copyKey() {
        try {
            await navigator.clipboard.writeText(pixKey)
            setCopyState('copied')
        } catch {
            // Sem permissão da área de transferência: a chave segue visível para copiar à mão.
            setCopyState('failed')
        }
    }

    return (
        <section className={styles.block} aria-label="Pagamento por Pix">
            <h3 className={styles.title}>Pague com Pix</h3>
            <p className={styles.total}>
                <span>Total</span>
                <strong>{formatCents(totalCents)}</strong>
            </p>
            <div className={styles.keyGroup}>
                <span className={styles.keyLabel}>{keyLabel}</span>
                <strong className={styles.key}>{pixKey}</strong>
            </div>
            <div className={styles.actions}>
                <Button variant="secondary" wide onClick={copyKey}>
                    <ThemeIcon name="pix" size={20} />
                    Copiar chave
                </Button>
                {copyState === 'copied' ? (
                    <p className={styles.copied} role="status">
                        Chave copiada
                    </p>
                ) : null}
                {copyState === 'failed' ? (
                    <p className={styles.failed} role="status">
                        Não deu para copiar. Selecione a chave e copie.
                    </p>
                ) : null}
                <a className={styles.receipt} href={receiptUrl} target="_blank" rel="noopener noreferrer">
                    <ThemeIcon name="whatsapp" size={20} />
                    Enviar comprovante
                </a>
            </div>
            <p className={styles.note}>A loja confere o comprovante antes de confirmar o pagamento.</p>
        </section>
    )
}
