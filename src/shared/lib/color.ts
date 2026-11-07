const DARK_TEXT = '#1c1917'
const LIGHT_TEXT = '#ffffff'
// Limite de luminância relativa (WCAG) acima do qual texto escuro lê melhor.
const LUMINANCE_THRESHOLD = 0.4

function toLinearChannel(channel: number): number {
    const normalized = channel / 255
    const linear = normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
    return linear
}

export function pickReadableTextColor(hexColor: string): string {
    const red = toLinearChannel(Number.parseInt(hexColor.slice(1, 3), 16))
    const green = toLinearChannel(Number.parseInt(hexColor.slice(3, 5), 16))
    const blue = toLinearChannel(Number.parseInt(hexColor.slice(5, 7), 16))
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

    const textColor = luminance > LUMINANCE_THRESHOLD ? DARK_TEXT : LIGHT_TEXT
    return textColor
}
