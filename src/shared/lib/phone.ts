const LANDLINE_DIGITS = 10
const MOBILE_DIGITS = 11

export function keepDigits(text: string): string {
    const digits = text.replace(/\D/g, '')
    return digits
}

// Formata enquanto a pessoa digita: (18) 99664-9346.
export function formatBrazilianPhone(text: string): string {
    const digits = keepDigits(text).slice(0, MOBILE_DIGITS)
    const areaCode = digits.slice(0, 2)
    const splitAt = digits.length === MOBILE_DIGITS ? 7 : 6
    const firstPart = digits.slice(2, splitAt)
    const secondPart = digits.slice(splitAt)

    if (digits.length <= 2) {
        return digits
    }

    const withArea = `(${areaCode}) ${firstPart}`
    const formatted = secondPart ? `${withArea}-${secondPart}` : withArea
    return formatted
}

export function isValidBrazilianPhone(text: string): boolean {
    const length = keepDigits(text).length
    const isValid = length === LANDLINE_DIGITS || length === MOBILE_DIGITS
    return isValid
}
