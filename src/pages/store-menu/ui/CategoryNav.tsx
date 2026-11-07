import { AssetIcon, ThemeIcon } from '@/shared/ui'

import { toAssetStem } from '../model/search'
import type { Category } from '../model/types'
import styles from './category-nav.module.css'

type CategoryNavProps = {
    categories: readonly Category[]
    query: string
    onQueryChange: (query: string) => void
}

function scrollToCategory(categoryId: string) {
    document.getElementById(`categoria-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function CategoryNav({ categories, query, onQueryChange }: CategoryNavProps) {
    return (
        <nav className={styles.nav} aria-label="Categorias do cardápio">
            <label className={styles.search}>
                <ThemeIcon name="busca" size={18} />
                <span className="visually-hidden">Buscar no cardápio</span>
                <input
                    type="search"
                    placeholder="Buscar no cardápio"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                />
            </label>
            <ul className={styles.chips}>
                {categories.map((category) => (
                    <li key={category.id}>
                        <button type="button" className={styles.chip} onClick={() => scrollToCategory(category.id)}>
                            <AssetIcon stem={`categoria-${toAssetStem(category.name)}`} size={18} />
                            {category.name}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
