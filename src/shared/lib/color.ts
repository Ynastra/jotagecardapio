const DARK_TEXT = '#1c1917'
const LIGHT_TEXT = '#ffffff'
// Limite de luminância relativa (WCAG) acima do qual texto escuro lê melhor.
const LUMINANCE_THRESHOLD = 0.4
// Acréscimo da fórmula de contraste WCAG que evita divisão por zero no preto.
const CONTRAST_OFFSET = 0.05

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

function toLinearChannel(channel: number): number {
    const normalized = channel / 255
    const linear = normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
    return linear
}

export function isHexColor(text: string): boolean {
    const isHex = HEX_COLOR_PATTERN.test(text)
    return isHex
}

function getRelativeLuminance(hexColor: string): number {
    const red = toLinearChannel(Number.parseInt(hexColor.slice(1, 3), 16))
    const green = toLinearChannel(Number.parseInt(hexColor.slice(3, 5), 16))
    const blue = toLinearChannel(Number.parseInt(hexColor.slice(5, 7), 16))
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
    return luminance
}

export function pickReadableTextColor(hexColor: string): string {
    const luminance = getRelativeLuminance(hexColor)

    const textColor = luminance > LUMINANCE_THRESHOLD ? DARK_TEXT : LIGHT_TEXT
    return textColor
}

// Razão de contraste WCAG entre duas cores hexadecimais, de 1 a 21.
export function getContrastRatio(firstHex: string, secondHex: string): number {
    const firstLuminance = getRelativeLuminance(firstHex)
    const secondLuminance = getRelativeLuminance(secondHex)
    const lighter = Math.max(firstLuminance, secondLuminance)
    const darker = Math.min(firstLuminance, secondLuminance)

    const ratio = (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET)
    return ratio
}
