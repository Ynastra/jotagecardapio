import { useThemeAsset } from '@/shared/lib'

import styles from './theme-image.module.css'

const PHOTO_EXTENSIONS = ['jpg', 'png', 'webp'] as const

type ThemeImageProps = {
    // URL própria (foto do produto, capa da loja) tem prioridade sobre o tema.
    src: string | null
    fallbackStem: string
    alt: string
    className?: string
}

export function ThemeImage({ src, fallbackStem, alt, className }: ThemeImageProps) {
    const fallbackUrl = useThemeAsset(fallbackStem, PHOTO_EXTENSIONS)
    const imageUrl = src ?? fallbackUrl
    const classes = [styles.image, className].filter(Boolean).join(' ')

    if (!imageUrl) {
        return <span className={`${classes} ${styles.placeholder}`} role="img" aria-label={alt} />
    }

    return <img className={classes} src={imageUrl} alt={alt} loading="lazy" decoding="async" />
}
