const CENTS_PER_REAL = 100

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCents(cents: number): string {
    const formatted = currencyFormatter.format(cents / CENTS_PER_REAL)
    return formatted
}

const DOT_AS_DECIMAL = /^(.*)\.(\d{1,2})$/

// Com vírgula, a vírgula é o decimal e os pontos são milhar. Sem vírgula, um ponto
// seguido de uma ou duas casas no fim é decimal ("8.00") e os demais são milhar ("1.050").
function toDecimalText(cleaned: string): string {
    if (cleaned.includes(',')) {
        const withCommaAsDecimal = cleaned.replace(/\./g, '').replace(',', '.')
        return withCommaAsDecimal
    }

    const decimalMatch = DOT_AS_DECIMAL.exec(cleaned)
    if (decimalMatch) {
        const integerPart = decimalMatch[1].replace(/\./g, '')
        const decimalText = `${integerPart}.${decimalMatch[2]}`
        return decimalText
    }

    const withoutThousands = cleaned.replace(/\./g, '')
    return withoutThousands
}

// Aceita o que a pessoa digita: "50", "50,00", "8.00", "R$ 1.050,5". Valor negativo é inválido.
export function parseReaisToCents(text: string): number | null {
    if (text.includes('-')) {
        return null
    }

    const cleaned = text.replace(/[^\d,.]/g, '')
    const normalized = toDecimalText(cleaned)
    const reais = Number.parseFloat(normalized)

    if (normalized === '' || Number.isNaN(reais)) {
        return null
    }

    const cents = Math.round(reais * CENTS_PER_REAL)
    return cents
}
