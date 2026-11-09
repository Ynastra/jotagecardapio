const LANDLINE_DIGITS = 10
const MOBILE_DIGITS = 11
const BRAZIL_COUNTRY_CODE = '55'
const MIN_INTERNATIONAL_DIGITS = 12

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

// O WhatsApp da loja fica gravado com o código do país (5518996649346); na
// tela e no papel ele aparece como número nacional, (18) 99664-9346.
export function formatNationalPhone(whatsapp: string): string {
    const digits = keepDigits(whatsapp)
    const isInternational = digits.length >= MIN_INTERNATIONAL_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE)

    const national = isInternational ? digits.slice(BRAZIL_COUNTRY_CODE.length) : digits
    const formatted = formatBrazilianPhone(national)
    return formatted
}
