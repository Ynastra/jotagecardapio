import { useState } from 'react'

import { getProductAvailability, type ManagedProduct, type ProductAvailability } from '@/entities/product'
import { ThemeImage } from '@/shared/ui'

import { describeServes } from '../model/catalog'
import type { MoveDirection } from '../model/ordering'
import { ActionMenu } from './ActionMenu'
import { ActiveSwitch } from './ActiveSwitch'
import { InlinePriceField } from './InlinePriceField'
import styles from './products.module.css'

const AVAILABILITY_LABELS: Record<ProductAvailability, string> = {
    available: 'Disponível',
    inactive: 'Indisponível',
    soldOut: 'Sem estoque',
}

type ProductRowProps = {
    product: ManagedProduct
    isFirst: boolean
    isLast: boolean
    onChangePrice: (product: ManagedProduct, text: string) => Promise<string | null>
    onChangePromoPrice: (product: ManagedProduct, text: string) => Promise<string | null>
    onToggle: (productId: string, active: boolean) => void
    onEdit: (product: ManagedProduct) => void
    onEditAddons: (product: ManagedProduct) => void
    onDuplicate: (product: ManagedProduct) => void
    onMove: (product: ManagedProduct, direction: MoveDirection) => void
    onDelete: (product: ManagedProduct) => void
}

export function ProductRow({
    product,
    isFirst,
    isLast,
    onChangePrice,
    onChangePromoPrice,
    onToggle,
    onEdit,
    onEditAddons,
    onDuplicate,
    onMove,
    onDelete,
}: ProductRowProps) {
    const [isAddingDiscount, setAddingDiscount] = useState(false)
    const availability = getProductAvailability(product)
    const rowClass = product.active ? styles.row : `${styles.row} ${styles.rowInactive}`
    const badgeClass = availability === 'available' ? `${styles.badge} ${styles.badgeAvailable}` : styles.badge
    const hasDiscount = product.promoPriceCents !== null

    return (
        <li className={rowClass}>
            <ThemeImage className={styles.rowPhoto} src={product.imageUrl} fallbackStem="produto-sem-foto" alt="" />
            <div className={styles.rowText}>
                <div className={styles.rowNameLine}>
                    <span className={styles.rowName}>{product.name}</span>
                    <span className={badgeClass}>{AVAILABILITY_LABELS[availability]}</span>
                </div>
                {product.description ? <span className={styles.rowDescription}>{product.description}</span> : null}
                {product.serves ? <span className={styles.rowServes}>{describeServes(product.serves)}</span> : null}
            </div>
            <div className={styles.rowControls}>
                <InlinePriceField
                    label={`Preço de ${product.name}`}
                    priceCents={product.priceCents}
                    onCommit={(text) => onChangePrice(product, text)}
                />
                {hasDiscount || isAddingDiscount ? (
                    <InlinePriceField
                        label={`Preço promocional de ${product.name}`}
                        priceCents={product.promoPriceCents}
                        autoFocus={isAddingDiscount}
                        onCommit={(text) => onChangePromoPrice(product, text)}
                        onDismiss={() => setAddingDiscount(false)}
                    />
                ) : (
                    <button type="button" className={styles.discountButton} onClick={() => setAddingDiscount(true)}>
                        Adicionar desconto
                    </button>
                )}
                <ActiveSwitch
                    label={`${product.name} ativo`}
                    checked={product.active}
                    onChange={(checked) => onToggle(product.id, checked)}
                />
                <ActionMenu
                    label={`Ações de ${product.name}`}
                    actions={[
                        { label: 'Editar', onSelect: () => onEdit(product) },
                        { label: 'Duplicar', onSelect: () => onDuplicate(product) },
                        { label: 'Adicionais', onSelect: () => onEditAddons(product) },
                        { label: 'Subir', onSelect: () => onMove(product, 'up'), disabled: isFirst },
                        { label: 'Descer', onSelect: () => onMove(product, 'down'), disabled: isLast },
                        { label: 'Excluir', onSelect: () => onDelete(product), isDanger: true },
                    ]}
                />
            </div>
        </li>
    )
}
