import { formatCents } from '@/shared/lib'
import { ThemeIcon, ThemeImage } from '@/shared/ui'

import type { Product } from '../model/types'
import styles from './product-card.module.css'

type ProductCardProps = {
    product: Product
    onOpen: (productId: string) => void
    // tile: cartão compacto da faixa de destaques; row: linha da lista.
    layout?: 'row' | 'tile'
}

function ProductPrice({ product }: { product: Product }) {
    if (product.promoPriceCents === null) {
        return <strong className={styles.price}>{formatCents(product.priceCents)}</strong>
    }

    return (
        <span className={styles.priceGroup}>
            <s className={styles.oldPrice}>{formatCents(product.priceCents)}</s>
            <strong className={`${styles.price} ${styles.promoPrice}`}>{formatCents(product.promoPriceCents)}</strong>
        </span>
    )
}

export function ProductCard({ product, onOpen, layout = 'row' }: ProductCardProps) {
    const hasMeta = product.portionLabel !== null || product.serves !== null

    return (
        <button type="button" className={styles[layout]} onClick={() => onOpen(product.id)}>
            <div className={styles.info}>
                <h3 className={styles.name}>{product.name}</h3>
                {hasMeta && layout === 'row' ? (
                    <p className={styles.meta}>
                        {product.portionLabel ? <span>{product.portionLabel}</span> : null}
                        {product.serves ? (
                            <span className={styles.serves}>
                                <ThemeIcon name="pessoas" size={14} />
                                Serve {product.serves}
                            </span>
                        ) : null}
                    </p>
                ) : null}
                {product.description && layout === 'row' ? (
                    <p className={styles.description}>{product.description}</p>
                ) : null}
                <ProductPrice product={product} />
            </div>
            <ThemeImage className={styles.photo} src={product.imageUrl} fallbackStem="produto-sem-foto" alt="" />
        </button>
    )
}
