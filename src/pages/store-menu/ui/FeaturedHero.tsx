import { formatCents } from '@/shared/lib'

import type { FeaturedHero as FeaturedHeroPick } from '../model/featured-hero'
import type { Product } from '../model/types'
import styles from './featured-hero.module.css'

const HYPHEN = /-/g
const NON_BREAKING_HYPHEN = '‑'

// No tamanho do destaque, "X-" sozinho numa linha parece outro produto; o
// hífen inseparável mantém o nome composto inteiro e a quebra fica nos espaços.
function keepHyphenatedWordsTogether(name: string): string {
    const displayName = name.replace(HYPHEN, NON_BREAKING_HYPHEN)
    return displayName
}

type FeaturedHeroProps = {
    hero: FeaturedHeroPick
    coverUrl: string | null
    onOpen: (productId: string) => void
}

function HeroPrice({ product }: { product: Product }) {
    if (product.promoPriceCents === null) {
        return <span>{formatCents(product.priceCents)}</span>
    }

    return (
        <span className={styles.priceGroup}>
            <s className={styles.oldPrice}>
                <span className="visually-hidden">Preço anterior </span>
                {formatCents(product.priceCents)}
            </s>
            <span className={styles.promoPrice}>
                <span className="visually-hidden">Preço promocional </span>
                {formatCents(product.promoPriceCents)}
            </span>
        </span>
    )
}

export function FeaturedHero({ hero, coverUrl, onOpen }: FeaturedHeroProps) {
    const { product, hasPhoto } = hero
    const photoUrl = hasPhoto ? product.imageUrl : null
    const textClasses = hasPhoto ? styles.text : `${styles.text} ${styles.textWide}`

    return (
        <div className={styles.section}>
            <button type="button" className={styles.hero} onClick={() => onOpen(product.id)}>
                {hasPhoto || !coverUrl ? null : (
                    <img className={styles.cover} src={coverUrl} alt="" decoding="async" />
                )}
                <span className={textClasses}>
                    <span className={styles.kicker}>Destaque da casa</span>
                    <span className={styles.name}>{keepHyphenatedWordsTogether(product.name)}</span>
                    {product.description ? <span className={styles.description}>{product.description}</span> : null}
                    <span className={styles.price}>
                        <HeroPrice product={product} />
                        <span className={styles.arrow} aria-hidden="true">
                            ↗
                        </span>
                    </span>
                </span>
                {photoUrl ? <img className={styles.photo} src={photoUrl} alt="" decoding="async" /> : null}
            </button>
        </div>
    )
}
