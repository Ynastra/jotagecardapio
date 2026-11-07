import { keepDigits } from './phone'

const CEP_DIGITS = 8
const CEP_PREFIX_DIGITS = 5

export function isValidCep(text: string): boolean {
    const isValid = keepDigits(text).length === CEP_DIGITS
    return isValid
}

// Formata enquanto a pessoa digita: 17780-000.
export function formatCep(text: string): string {
    const digits = keepDigits(text).slice(0, CEP_DIGITS)

    if (digits.length <= CEP_PREFIX_DIGITS) {
        return digits
    }

    const formatted = `${digits.slice(0, CEP_PREFIX_DIGITS)}-${digits.slice(CEP_PREFIX_DIGITS)}`
    return formatted
}
