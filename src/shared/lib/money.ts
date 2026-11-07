const CENTS_PER_REAL = 100

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCents(cents: number): string {
    const formatted = currencyFormatter.format(cents / CENTS_PER_REAL)
    return formatted
}

// Aceita o que a pessoa digita no campo de troco: "50", "50,00", "R$ 1.050,5".
export function parseReaisToCents(text: string): number | null {
    const normalized = text.replace(/[^\d,]/g, '').replace(',', '.')
    const reais = Number.parseFloat(normalized)

    if (normalized === '' || Number.isNaN(reais)) {
        return null
    }

    const cents = Math.round(reais * CENTS_PER_REAL)
    return cents
}
