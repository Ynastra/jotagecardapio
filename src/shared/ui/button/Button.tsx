import type { ButtonHTMLAttributes } from 'react'

import styles from './button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    wide?: boolean
}

export function Button({ variant = 'primary', wide = false, className, type = 'button', ...rest }: ButtonProps) {
    const classes = [styles.button, styles[variant], wide ? styles.wide : '', className].filter(Boolean).join(' ')
    return <button type={type} className={classes} {...rest} />
}
