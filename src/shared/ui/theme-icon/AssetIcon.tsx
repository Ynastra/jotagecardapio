import type { CSSProperties } from 'react'

import { useThemeAsset } from '@/shared/lib'

import styles from './theme-icon.module.css'

type AssetIconProps = {
    // Nome do arquivo sem extensão, procurado nas pastas do tema.
    stem: string
    size: number
}

// Ícone que só existe se o tema tiver o arquivo (ex.: ícone de categoria de
// uma loja); sem arquivo, não ocupa espaço.
export function AssetIcon({ stem, size }: AssetIconProps) {
    const assetUrl = useThemeAsset(stem)

    if (!assetUrl) {
        return null
    }

    const maskStyle = { '--icon-url': `url("${assetUrl}")`, '--icon-size': `${size}px` } as CSSProperties
    return <span className={styles.masked} style={maskStyle} aria-hidden />
}
