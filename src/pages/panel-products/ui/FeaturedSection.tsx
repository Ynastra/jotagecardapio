import type { ManagedProduct } from '@/entities/product'
import { formatCents } from '@/shared/lib'
import { Button, ThemeImage } from '@/shared/ui'

import { MAX_FEATURED } from '../model/catalog'
import styles from './products.module.css'

type FeaturedSectionProps = {
    products: readonly ManagedProduct[]
    onEdit: (product: ManagedProduct) => void
    onRemove: (productId: string) => void
    onSelect: () => void
}

function FeaturedPrice({ product }: { product: ManagedProduct }) {
    if (product.promoPriceCents === null) {
        return <strong>{formatCents(product.priceCents)}</strong>
    }

    return (
        <span>
            <s>{formatCents(product.priceCents)}</s> <strong>{formatCents(product.promoPriceCents)}</strong>
        </span>
    )
}

export function FeaturedSection({ products, onEdit, onRemove, onSelect }: FeaturedSectionProps) {
    return (
        <section className={styles.featured} aria-label="Destaques">
            <div className={styles.featuredHead}>
                <h2 className={styles.featuredTitle}>Destaques</h2>
                <span className={styles.featuredCount}>
                    {products.length}/{MAX_FEATURED}
                </span>
            </div>
            <ul className={styles.featuredList}>
                {products.map((product) => (
                    <li key={product.id} className={styles.featuredCard}>
                        <ThemeImage
                            className={styles.featuredPhoto}
                            src={product.imageUrl}
                            fallbackStem="produto-sem-foto"
                            alt=""
                        />
                        <span className={styles.featuredName}>{product.name}</span>
                        <FeaturedPrice product={product} />
                        <div className={styles.featuredActions}>
                            <Button variant="ghost" onClick={() => onEdit(product)}>
                                Editar
                            </Button>
                            <Button variant="ghost" onClick={() => onRemove(product.id)}>
                                Remover
                            </Button>
                        </div>
                    </li>
                ))}
                <li>
                    <button type="button" className={styles.featuredAdd} onClick={onSelect}>
                        Selecionar
                    </button>
                </li>
            </ul>
        </section>
    )
}
