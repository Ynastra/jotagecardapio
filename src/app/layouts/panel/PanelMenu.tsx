import { NavLink } from 'react-router-dom'

import type { Store } from '@/entities/store'
import { supabase } from '@/shared/api'

import { MENU_ITEMS, PANEL_MENU_ID } from './menu-items'
import styles from './panel-layout.module.css'

type PanelMenuProps = {
    store: Store
    isOpen: boolean
    onNavigate: () => void
    onClose: () => void
}

export function PanelMenu({ store, isOpen, onNavigate, onClose }: PanelMenuProps) {
    const menuClasses = [styles.menu, isOpen ? styles.menuOpen : ''].filter(Boolean).join(' ')

    return (
        <nav id={PANEL_MENU_ID} className={menuClasses} aria-label="Menu do painel" tabIndex={-1}>
            <button type="button" className={styles.menuClose} onClick={onClose}>
                Fechar
            </button>
            <img className={styles.logo} src="/marca/logo-horizontal-branco.png" alt="JG Cardápio" />
            <p className={styles.storeName}>{store.name}</p>

            <ul className={styles.menuList}>
                {MENU_ITEMS.map((item) => (
                    <li key={item.path}>
                        {item.isReady ? (
                            <NavLink
                                to={`/painel/${item.path}`}
                                className={({ isActive }) =>
                                    [styles.menuItem, isActive ? styles.menuItemActive : ''].filter(Boolean).join(' ')
                                }
                                onClick={onNavigate}
                            >
                                {item.label}
                            </NavLink>
                        ) : (
                            <span className={`${styles.menuItem} ${styles.menuItemDisabled}`} aria-disabled="true">
                                {item.label}
                                <span className={styles.soon}>Em breve</span>
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            <ul className={styles.menuFooter}>
                <li>
                    <a className={styles.menuItem} href={`/${store.slug}`} target="_blank" rel="noopener noreferrer">
                        Ver cardápio
                    </a>
                </li>
                <li>
                    <button type="button" className={styles.menuItem} onClick={() => supabase.auth.signOut()}>
                        Sair
                    </button>
                </li>
            </ul>
        </nav>
    )
}
