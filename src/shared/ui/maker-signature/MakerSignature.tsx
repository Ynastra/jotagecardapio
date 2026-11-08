import styles from './maker-signature.module.css'

type MakerSignatureProps = {
    className?: string
}

export function MakerSignature({ className }: MakerSignatureProps) {
    const classes = [styles.signature, className].filter(Boolean).join(' ')

    return (
        <p className={classes}>
            Um produto
            <img className={styles.symbol} src="/marca/jotagetech-simbolo.svg" alt="" />
            <strong className={styles.name}>JotagêTech</strong>
        </p>
    )
}
