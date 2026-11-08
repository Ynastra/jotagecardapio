import type { ManagedCategory } from '@/entities/product'

import { NAME_MAX, type ProductDraft, type ProductFormErrors } from '../model/product-form'
import { ImageField } from './ImageField'
import styles from './product-edit.module.css'

const NEW_CATEGORY_VALUE = 'nova-categoria'

type BasicSectionProps = {
    storeId: string
    draft: ProductDraft
    errors: ProductFormErrors['fields']
    categories: readonly ManagedCategory[]
    onChange: (patch: Partial<ProductDraft>) => void
    onCreateCategory: () => void
}

export function BasicSection({ storeId, draft, errors, categories, onChange, onCreateCategory }: BasicSectionProps) {
    function handleCategoryChange(value: string) {
        if (value === NEW_CATEGORY_VALUE) {
            onCreateCategory()
            return
        }

        onChange({ categoryId: value })
    }

    return (
        <section className={styles.section} aria-label="Dados do produto">
            <h2 className={styles.sectionTitle}>Produto</h2>

            <label className={styles.switch}>
                <input
                    type="checkbox"
                    role="switch"
                    checked={draft.active}
                    onChange={(event) => onChange({ active: event.target.checked })}
                />
                {draft.active ? 'Ativado' : 'Desativado'}
            </label>

            <label className={styles.field}>
                Categoria
                <select
                    value={draft.categoryId}
                    aria-invalid={errors.categoryId !== undefined}
                    onChange={(event) => handleCategoryChange(event.target.value)}
                >
                    <option value="">Escolha a categoria</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                    <option value={NEW_CATEGORY_VALUE}>Criar nova categoria</option>
                </select>
                {errors.categoryId ? <span className={styles.fieldError}>{errors.categoryId}</span> : null}
            </label>

            <ImageField storeId={storeId} imageUrl={draft.imageUrl} onChange={(imageUrl) => onChange({ imageUrl })} />

            <label className={styles.field}>
                Título
                <input
                    value={draft.name}
                    maxLength={NAME_MAX}
                    aria-invalid={errors.name !== undefined}
                    onChange={(event) => onChange({ name: event.target.value })}
                />
                {errors.name ? <span className={styles.fieldError}>{errors.name}</span> : null}
            </label>

            <div className={styles.fieldRow}>
                <label className={styles.field}>
                    Preço
                    <input
                        inputMode="decimal"
                        placeholder="0,00"
                        value={draft.priceText}
                        aria-invalid={errors.priceText !== undefined}
                        onChange={(event) => onChange({ priceText: event.target.value })}
                    />
                    {errors.priceText ? <span className={styles.fieldError}>{errors.priceText}</span> : null}
                </label>
                <label className={styles.field}>
                    Desconto
                    <input
                        inputMode="decimal"
                        placeholder="Preço promocional"
                        value={draft.promoText}
                        aria-invalid={errors.promoText !== undefined}
                        onChange={(event) => onChange({ promoText: event.target.value })}
                    />
                    {errors.promoText ? <span className={styles.fieldError}>{errors.promoText}</span> : null}
                </label>
            </div>
        </section>
    )
}
