import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import type { DraftLine, OrderMessageContext, PlacedOrder } from '@/entities/order'
import { buildBrandStyle, ThemeProvider } from '@/shared/lib'
import { Button, StatusMessage, ThemeIcon } from '@/shared/ui'

import { countProductInCart, getMaxQuantity, getProductAvailability } from '../model/availability'
import { isStoreOpenNow } from '../model/opening-hours'
import { buildOrderConfirmation } from '../model/order-confirmation'
import { filterCategories } from '../model/search'
import type { Store, StoreMenu } from '../model/types'
import { useCart } from '../model/use-cart'
import { useStoreMenu } from '../model/use-store-menu'
import { CartBar } from './CartBar'
import { CategoryNav } from './CategoryNav'
import { CheckoutSheet } from './CheckoutSheet'
import { OrderConfirmation } from './OrderConfirmation'
import { ProductCard } from './ProductCard'
import { ProductSheet } from './ProductSheet'
import { StoreHeader } from './StoreHeader'
import styles from './store-menu-page.module.css'

const PRODUCT_PARAM = 'p'
const OPEN_STATUS_REFRESH_MS = 60_000

type PlacedConfirmation = {
    order: PlacedOrder
    context: OrderMessageContext
}

// O status aberto/fechado muda sozinho com o relógio, sem recarregar a página.
function useStoreOpen(store: Store): boolean {
    const [isOpen, setOpen] = useState(() => isStoreOpenNow(store))

    useEffect(() => {
        const refresh = () => setOpen(isStoreOpenNow(store))
        refresh()
        const interval = window.setInterval(refresh, OPEN_STATUS_REFRESH_MS)
        return () => window.clearInterval(interval)
    }, [store])

    return isOpen
}

function StoreMenuView({ menu }: { menu: StoreMenu }) {
    const { store, categories } = menu
    const products = useMemo(() => categories.flatMap((category) => category.products), [categories])
    const availableProductIds = useMemo(
        () => new Set(products.filter((product) => getProductAvailability(product) === 'available').map((product) => product.id)),
        [products],
    )
    const cart = useCart(store.slug, availableProductIds)
    const isOpen = useStoreOpen(store)
    const [searchParams, setSearchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [isCheckoutOpen, setCheckoutOpen] = useState(false)
    const [placed, setPlaced] = useState<PlacedConfirmation | null>(null)

    const requestedProduct = products.find((product) => product.id === searchParams.get(PRODUCT_PARAM))
    const selectedProduct =
        requestedProduct && getProductAvailability(requestedProduct) === 'available' ? requestedProduct : undefined
    const visibleCategories = filterCategories(categories, query)
    const featuredProducts = products.filter((product) => product.featured)
    const showFeatured = featuredProducts.length > 0 && query.trim() === ''
    const confirmation = placed ? buildOrderConfirmation(store, placed.order, placed.context) : null

    useEffect(() => {
        document.title = `${store.name} · Cardápio`
    }, [store.name])

    function getLineMaxQuantity(line: DraftLine): number {
        const product = products.find((candidate) => candidate.id === line.productId)
        const elsewhere = countProductInCart(cart.lines, line.productId, line.key)
        const max = product ? getMaxQuantity(product, elsewhere) : line.quantity
        return max
    }

    function openProduct(productId: string) {
        setSearchParams({ [PRODUCT_PARAM]: productId })
    }

    function closeProduct() {
        setSearchParams({}, { replace: true })
    }

    function handleAdd(line: DraftLine) {
        cart.add(line)
        closeProduct()
    }

    function handlePlaced(order: PlacedOrder, context: OrderMessageContext) {
        cart.clear()
        setCheckoutOpen(false)
        setPlaced({ order, context })
    }

    return (
        <div className={styles.page} style={buildBrandStyle(store)}>
            <StoreHeader store={store} isOpen={isOpen} />
            <CategoryNav categories={categories} query={query} onQueryChange={setQuery} />

            <main className={styles.content}>
                {showFeatured ? (
                    <section className={styles.featured} aria-labelledby="destaques">
                        <h2 id="destaques" className={styles.sectionTitle}>
                            <ThemeIcon name="destaque" size={22} />
                            Destaques
                        </h2>
                        <div className={styles.featuredList}>
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} onOpen={openProduct} layout="tile" />
                            ))}
                        </div>
                    </section>
                ) : null}

                {visibleCategories.map((category) => (
                    <section
                        key={category.id}
                        id={`categoria-${category.id}`}
                        className={styles.category}
                        aria-labelledby={`titulo-${category.id}`}
                    >
                        <h2 id={`titulo-${category.id}`} className={styles.sectionTitle}>
                            {category.name}
                        </h2>
                        <ul className={styles.products}>
                            {category.products.map((product) => (
                                <li key={product.id}>
                                    <ProductCard product={product} onOpen={openProduct} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}

                {visibleCategories.length === 0 ? (
                    <p className={styles.noResults}>Nada encontrado para "{query}".</p>
                ) : null}
            </main>

            <footer className={styles.footer}>
                <a href="/">
                    <img className={styles.seal} src="/marca/selo-feito-com.png" alt="Feito com JG Cardápio" />
                </a>
            </footer>

            {cart.itemCount > 0 ? (
                <CartBar itemCount={cart.itemCount} subtotalCents={cart.subtotalCents} onOpen={() => setCheckoutOpen(true)} />
            ) : null}

            {selectedProduct ? (
                <ProductSheet
                    key={selectedProduct.id}
                    product={selectedProduct}
                    maxQuantity={getMaxQuantity(selectedProduct, countProductInCart(cart.lines, selectedProduct.id))}
                    onAdd={handleAdd}
                    onClose={closeProduct}
                />
            ) : null}

            {isCheckoutOpen ? (
                <CheckoutSheet
                    store={store}
                    lines={cart.lines}
                    subtotalCents={cart.subtotalCents}
                    isStoreOpen={isOpen}
                    onSetQuantity={cart.setQuantity}
                    getLineMaxQuantity={getLineMaxQuantity}
                    onPlaced={handlePlaced}
                    onClose={() => setCheckoutOpen(false)}
                />
            ) : null}

            {confirmation ? <OrderConfirmation {...confirmation} onClose={() => setPlaced(null)} /> : null}
        </div>
    )
}

export function StoreMenuPage() {
    const { slug = '' } = useParams()
    const state = useStoreMenu(slug)
    const folders = state.status === 'ready' ? [slug, state.menu.store.theme] : ['base']

    return (
        <ThemeProvider folders={folders}>
            {state.status === 'loading' ? <p className={styles.loading}>Carregando cardápio</p> : null}
            {state.status === 'ready' ? <StoreMenuView menu={state.menu} /> : null}
            {state.status === 'not-found' ? (
                <StatusMessage illustration="nao-encontrado" title="Cardápio não encontrado">
                    <p>Confira o endereço que você recebeu da loja.</p>
                </StatusMessage>
            ) : null}
            {state.status === 'error' ? (
                <StatusMessage illustration="erro-conexao" title="Não deu para abrir o cardápio">
                    <p>Confira a internet e tente de novo.</p>
                    <Button onClick={() => window.location.reload()}>Tentar de novo</Button>
                </StatusMessage>
            ) : null}
        </ThemeProvider>
    )
}
