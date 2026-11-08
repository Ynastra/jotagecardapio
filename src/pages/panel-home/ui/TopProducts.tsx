import { ThemeImage } from '@/shared/ui'

import { percentOf, type TopProduct } from '../model/dashboard'
import styles from './panel-home.module.css'

type TopProductsProps = {
    products: TopProduct[]
    itemsTotal: number
    formatMoney: (cents: number) => string
}

function describeProduct(product: TopProduct, itemsTotal: number, formatMoney: (cents: number) => string): string {
    const sales = `Vendas ${product.quantity}`
    const share = `${percentOf(product.quantity, itemsTotal)}% dos itens`
    const parts = product.priceCents === null ? [sales, share] : [formatMoney(product.priceCents), sales, share]
    const description = parts.join(' · ')
    return description
}

export function TopProducts({ products, itemsTotal, formatMoney }: TopProductsProps) {
    return (
        <section className={styles.section} aria-labelledby="mais-vendidos">
            <h2 id="mais-vendidos" className={styles.sectionTitle}>
                Mais vendidos
            </h2>
            {products.length === 0 ? (
                <p className={styles.muted}>Nenhum produto vendido neste período</p>
            ) : (
                <ol className={styles.productList}>
                    {products.map((product) => (
                        <li key={product.productId ?? product.name} className={styles.product}>
                            <ThemeImage
                                className={styles.photo}
                                src={product.imageUrl}
                                fallbackStem="produto-sem-foto"
                                alt=""
                            />
                            <div>
                                <div className={styles.productName}>{product.name}</div>
                                <div className={styles.productMeta}>{describeProduct(product, itemsTotal, formatMoney)}</div>
                            </div>
                            <div className={styles.productRevenue}>{formatMoney(product.revenueCents)}</div>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}
