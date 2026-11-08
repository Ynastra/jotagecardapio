import { useEffect, useRef, useState } from 'react'

import { AssetIcon, ThemeIcon } from '@/shared/ui'

import { toAssetStem } from '../model/search'
import type { Category } from '../model/types'
import { getScrollBehavior } from '../model/use-active-section'
import styles from './category-nav.module.css'

type CategoryNavProps = {
    categories: readonly Category[]
    query: string
    onQueryChange: (query: string) => void
    activeId: string
    onSelect: (sectionId: string) => void
}

function revealActiveChip(chipRow: HTMLElement) {
    const activeChip = chipRow.querySelector<HTMLElement>('[aria-current="true"]')

    if (!activeChip) {
        return
    }

    const rowBox = chipRow.getBoundingClientRect()
    const chipBox = activeChip.getBoundingClientRect()
    const centeredOffset = (rowBox.width - chipBox.width) / 2
    const left = chipRow.scrollLeft + chipBox.left - rowBox.left - centeredOffset

    chipRow.scrollTo({ left, behavior: getScrollBehavior() })
}

export function CategoryNav({ categories, query, onQueryChange, activeId, onSelect }: CategoryNavProps) {
    const [isSearchOpen, setSearchOpen] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const chipRowRef = useRef<HTMLUListElement>(null)

    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus()
        }
    }, [isSearchOpen])

    useEffect(() => {
        if (chipRowRef.current) {
            revealActiveChip(chipRowRef.current)
        }
    }, [activeId, isSearchOpen])

    function closeSearch() {
        onQueryChange('')
        setSearchOpen(false)
    }

    function getChipClassName(sectionId: string): string {
        const className = sectionId === activeId ? `${styles.chip} ${styles.chipActive}` : styles.chip
        return className
    }

    return (
        <nav className={styles.nav} aria-label="Categorias do cardápio">
            <div className={styles.bar}>
                {isSearchOpen ? (
                    <label className={styles.search}>
                        <ThemeIcon name="busca" size={18} />
                        <span className="visually-hidden">Buscar no cardápio</span>
                        <input
                            ref={searchInputRef}
                            type="search"
                            placeholder="Buscar no cardápio"
                            value={query}
                            onChange={(event) => onQueryChange(event.target.value)}
                        />
                        <button type="button" className={styles.iconButton} aria-label="Fechar busca" onClick={closeSearch}>
                            <ThemeIcon name="fechar" size={18} />
                        </button>
                    </label>
                ) : (
                    <>
                        <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Buscar no cardápio"
                            onClick={() => setSearchOpen(true)}
                        >
                            <ThemeIcon name="busca" size={20} />
                        </button>
                        <ul ref={chipRowRef} className={styles.chips}>
                            {categories.map((category) => (
                                <li key={category.id}>
                                    <button
                                        type="button"
                                        className={getChipClassName(category.id)}
                                        aria-current={activeId === category.id}
                                        onClick={() => onSelect(category.id)}
                                    >
                                        <AssetIcon stem={`categoria-${toAssetStem(category.name)}`} size={18} />
                                        {category.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </nav>
    )
}
