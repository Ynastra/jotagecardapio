import { formatCents } from '@/shared/lib'
import { ThemeIcon } from '@/shared/ui'

import { getProductAvailability, type ProductAvailability } from '../model/availability'
import type { Product } from '../model/types'
import styles from './product-card.module.css'

const AVAILABILITY_BADGES: Record<Exclude<ProductAvailability, 'available'>, string> = {
    inactive: 'Indisponível',
    soldOut: 'Esgotado',
}

type ProductCardProps = {
    product: Product
    onOpen: (productId: string) => void
}

function ProductPrice({ product }: { product: Product }) {
    if (product.promoPriceCents === null) {
        return <strong className={styles.price}>{formatCents(product.priceCents)}</strong>
    }

    return (
        <span className={styles.priceGroup}>
            <s className={styles.oldPrice}>
                <span className="visually-hidden">Preço anterior </span>
                {formatCents(product.priceCents)}
            </s>
            <strong className={`${styles.price} ${styles.promoPrice}`}>
                <span className="visually-hidden">Preço promocional </span>
                {formatCents(product.promoPriceCents)}
            </strong>
        </span>
    )
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
    const hasMeta = product.portionLabel !== null || product.serves !== null
    const availability = getProductAvailability(product)
    const isAvailable = availability === 'available'
    const classes = isAvailable ? styles.row : `${styles.row} ${styles.unavailable}`

    return (
        <button type="button" className={classes} disabled={!isAvailable} onClick={() => onOpen(product.id)}>
            {product.imageUrl ? (
                <img className={styles.photo} src={product.imageUrl} alt="" loading="lazy" decoding="async" />
            ) : null}
            <div className={styles.info}>
                {isAvailable ? null : <span className={styles.badge}>{AVAILABILITY_BADGES[availability]}</span>}
                <h3 className={styles.name}>{product.name}</h3>
                {hasMeta ? (
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
                {product.description ? <p className={styles.description}>{product.description}</p> : null}
                <ProductPrice product={product} />
            </div>
            {isAvailable ? (
                <span className={styles.plus} aria-hidden="true">
                    +
                </span>
            ) : null}
        </button>
    )
}
