import type { CSSProperties } from 'react'

import { pickReadableTextColor } from './color'

type Branded = { brandColor: string | null }

// Sobrescreve a cor da marca na raiz da página; sem cor, vale a padrão dos tokens.
export function buildBrandStyle({ brandColor }: Branded): CSSProperties | undefined {
    if (!brandColor) {
        return undefined
    }

    const brandStyle = {
        '--color-brand': brandColor,
        '--color-on-brand': pickReadableTextColor(brandColor),
    } as CSSProperties
    return brandStyle
}
