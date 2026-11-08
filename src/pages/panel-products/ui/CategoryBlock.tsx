import type { ManagedProduct } from '@/entities/product'
import { Button } from '@/shared/ui'

import type { CatalogCategory } from '../model/catalog'
import type { MoveDirection } from '../model/ordering'
import { ActionMenu } from './ActionMenu'
import { ActiveSwitch } from './ActiveSwitch'
import { ProductRow } from './ProductRow'
import styles from './products.module.css'

type CategoryBlockProps = {
    category: CatalogCategory
    isFirst: boolean
    isLast: boolean
    onToggle: (categoryId: string, active: boolean) => void
    onRename: (category: CatalogCategory) => void
    onMove: (category: CatalogCategory, direction: MoveDirection) => void
    onDelete: (category: CatalogCategory) => void
    onNewProduct: (category: CatalogCategory) => void
    onChangePrice: (product: ManagedProduct, text: string) => Promise<string | null>
    onChangePromoPrice: (product: ManagedProduct, text: string) => Promise<string | null>
    onToggleProduct: (productId: string, active: boolean) => void
    onEditProduct: (product: ManagedProduct) => void
    onEditProductAddons: (product: ManagedProduct) => void
    onDuplicateProduct: (product: ManagedProduct) => void
    onMoveProduct: (product: ManagedProduct, direction: MoveDirection) => void
    onDeleteProduct: (product: ManagedProduct) => void
}

export function CategoryBlock({
    category,
    isFirst,
    isLast,
    onToggle,
    onRename,
    onMove,
    onDelete,
    onNewProduct,
    onChangePrice,
    onChangePromoPrice,
    onToggleProduct,
    onEditProduct,
    onEditProductAddons,
    onDuplicateProduct,
    onMoveProduct,
    onDeleteProduct,
}: CategoryBlockProps) {
    return (
        <section id={`categoria-${category.id}`} className={styles.block} aria-label={category.name}>
            <div className={styles.blockHead}>
                <h2 className={styles.blockTitle}>{category.name}</h2>
                <div className={styles.blockActions}>
                    <ActiveSwitch
                        label={`${category.name} ativa`}
                        checked={category.active}
                        onChange={(checked) => onToggle(category.id, checked)}
                    />
                    <Button variant="secondary" onClick={() => onNewProduct(category)}>
                        + Novo produto
                    </Button>
                    <ActionMenu
                        label={`Ações de ${category.name}`}
                        actions={[
                            { label: 'Renomear', onSelect: () => onRename(category) },
                            { label: 'Subir', onSelect: () => onMove(category, 'up'), disabled: isFirst },
                            { label: 'Descer', onSelect: () => onMove(category, 'down'), disabled: isLast },
                            { label: 'Excluir', onSelect: () => onDelete(category), isDanger: true },
                        ]}
                    />
                </div>
            </div>

            <ul className={styles.rows}>
                {category.products.map((product, index) => (
                    <ProductRow
                        key={product.id}
                        product={product}
                        isFirst={index === 0}
                        isLast={index === category.products.length - 1}
                        onChangePrice={onChangePrice}
                        onChangePromoPrice={onChangePromoPrice}
                        onToggle={onToggleProduct}
                        onEdit={onEditProduct}
                        onEditAddons={onEditProductAddons}
                        onDuplicate={onDuplicateProduct}
                        onMove={onMoveProduct}
                        onDelete={onDeleteProduct}
                    />
                ))}
            </ul>
        </section>
    )
}
