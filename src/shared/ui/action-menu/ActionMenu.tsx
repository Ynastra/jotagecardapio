import { useRef } from 'react'

import styles from './action-menu.module.css'

export type MenuAction = {
    label: string
    onSelect: () => void
    disabled?: boolean
    isDanger?: boolean
}

type ActionMenuProps = {
    label: string
    actions: readonly MenuAction[]
}

export function ActionMenu({ label, actions }: ActionMenuProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null)
    const toggleRef = useRef<HTMLElement>(null)

    function select(action: MenuAction) {
        toggleRef.current?.focus()
        if (detailsRef.current) {
            detailsRef.current.open = false
        }
        action.onSelect()
    }

    return (
        <details ref={detailsRef} className={styles.menu}>
            <summary ref={toggleRef} className={styles.toggle} aria-label={label}>
                Mais
            </summary>
            <div className={styles.list}>
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        className={action.isDanger ? `${styles.item} ${styles.danger}` : styles.item}
                        disabled={action.disabled}
                        onClick={() => select(action)}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </details>
    )
}
