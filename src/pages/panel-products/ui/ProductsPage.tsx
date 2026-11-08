import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { ManagedProduct } from '@/entities/product'
import { useCurrentStore } from '@/entities/store'
import { Button, ConfirmSheet, StatusMessage } from '@/shared/ui'

import {
    describeItemCount,
    filterCatalogBySearch,
    getCategoryDeletionBlock,
    type CatalogCategory,
} from '../model/catalog'
import { useCatalog } from '../model/use-catalog'
import { CategoryBlock } from './CategoryBlock'
import { CategorySheet } from './CategorySheet'
import { FeaturedPickerSheet } from './FeaturedPickerSheet'
import { FeaturedSection } from './FeaturedSection'
import styles from './products.module.css'

type SheetState =
    | { kind: 'category'; category: CatalogCategory | null }
    | { kind: 'featured' }
    | { kind: 'delete-category'; category: CatalogCategory }
    | { kind: 'delete-product'; product: ManagedProduct }

function jumpToCategory(categoryId: string) {
    document.getElementById(`categoria-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ProductsPage() {
    const store = useCurrentStore()
    const navigate = useNavigate()
    const products = useCatalog(store.id)
    const [search, setSearch] = useState('')
    const [sheet, setSheet] = useState<SheetState | null>(null)
    const [isDeleting, setDeleting] = useState(false)
    const visibleCategories = filterCatalogBySearch(products.catalog, search)
    const hasNoCategories = !products.isLoading && products.catalog.length === 0

    useEffect(() => {
        document.title = `Produtos · ${store.name}`
    }, [store.name])

    function closeSheet() {
        setSheet(null)
    }

    function requestCategoryDeletion(category: CatalogCategory) {
        const block = getCategoryDeletionBlock(category)
        if (block) {
            products.showError(block)
            return
        }

        setSheet({ kind: 'delete-category', category })
    }

    async function confirmDelete() {
        if (sheet?.kind !== 'delete-category' && sheet?.kind !== 'delete-product') {
            return
        }

        setDeleting(true)
        const deleted =
            sheet.kind === 'delete-category'
                ? await products.removeCategory(sheet.category.id)
                : await products.removeProduct(sheet.product.id)
        setDeleting(false)
        if (deleted) {
            closeSheet()
        }
    }

    function renderSheet() {
        if (!sheet) {
            return null
        }

        if (sheet.kind === 'category') {
            const { category } = sheet
            const save = (name: string) => (category ? products.editCategory(category.id, name) : products.addCategory(name))
            return <CategorySheet initialName={category?.name ?? null} onSave={save} onClose={closeSheet} />
        }

        if (sheet.kind === 'featured') {
            const candidates = products.catalog.flatMap((category) => category.products).filter((product) => !product.featured)
            return <FeaturedPickerSheet candidates={candidates} onSave={products.addFeatured} onClose={closeSheet} />
        }

        if (sheet.kind === 'delete-category') {
            return (
                <ConfirmSheet
                    title={`Excluir ${sheet.category.name}`}
                    message="A categoria vazia será excluída."
                    confirmLabel="Excluir categoria"
                    isPending={isDeleting}
                    onConfirm={confirmDelete}
                    onClose={closeSheet}
                />
            )
        }

        return (
            <ConfirmSheet
                title={`Excluir ${sheet.product.name}`}
                message="O produto some do cardápio e dos destaques."
                confirmLabel="Excluir produto"
                isPending={isDeleting}
                onConfirm={confirmDelete}
                onClose={closeSheet}
            />
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Produtos</h1>
                <Button onClick={() => setSheet({ kind: 'category', category: null })}>+ Nova categoria</Button>
            </div>

            <div className={styles.toolbar}>
                <input
                    className={styles.search}
                    type="search"
                    placeholder="Buscar produto"
                    aria-label="Buscar produto"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                {visibleCategories.length > 0 ? (
                    <nav className={styles.tabs} aria-label="Categorias">
                        {visibleCategories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                className={styles.tab}
                                onClick={() => jumpToCategory(category.id)}
                            >
                                {category.name} ({describeItemCount(category.products.length)})
                            </button>
                        ))}
                    </nav>
                ) : null}
            </div>

            {products.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{products.errorMessage}</p>
                    <Button variant="ghost" onClick={products.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}
            {products.isLoading ? <p className={styles.muted}>Carregando produtos</p> : null}
            {hasNoCategories ? (
                <StatusMessage illustration="painel-sem-pedidos" title="Nenhuma categoria ainda">
                    <p>Crie uma categoria, como Lanches ou Bebidas, e coloque os produtos nela.</p>
                </StatusMessage>
            ) : null}

            {products.isLoading || hasNoCategories ? null : (
                <FeaturedSection
                    products={products.featured}
                    onEdit={(product) => navigate(`/painel/produtos/${product.id}`)}
                    onRemove={(productId) => products.setFeatured(productId, false)}
                    onSelect={() => setSheet({ kind: 'featured' })}
                />
            )}

            <div className={styles.blocks}>
                {visibleCategories.map((category) => {
                    const position = products.catalog.findIndex((candidate) => candidate.id === category.id)
                    return (
                        <CategoryBlock
                            key={category.id}
                            category={category}
                            isFirst={position === 0}
                            isLast={position === products.catalog.length - 1}
                            onToggle={products.toggleCategory}
                            onRename={(target) => setSheet({ kind: 'category', category: target })}
                            onMove={(target, direction) => products.moveCategory(target.id, direction)}
                            onDelete={requestCategoryDeletion}
                            onNewProduct={(target) => navigate(`/painel/produtos/novo?categoria=${target.id}`)}
                            onChangePrice={products.changePrice}
                            onChangePromoPrice={products.changePromoPrice}
                            onToggleProduct={products.toggleProduct}
                            onEditProduct={(product) => navigate(`/painel/produtos/${product.id}`)}
                            onEditProductAddons={(product) => navigate(`/painel/produtos/${product.id}?secao=adicionais`)}
                            onDuplicateProduct={products.duplicateProduct}
                            onMoveProduct={products.moveProduct}
                            onDeleteProduct={(product) => setSheet({ kind: 'delete-product', product })}
                        />
                    )
                })}
            </div>

            {renderSheet()}
        </div>
    )
}
