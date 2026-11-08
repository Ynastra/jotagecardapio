import type { PixKeyType } from '@/entities/store'
import { isValidBrazilianPhone, keepDigits } from '@/shared/lib'

export const PIX_KEY_MAX = 77

export const PIX_KEY_TYPES: readonly PixKeyType[] = ['cnpj', 'cpf', 'email', 'phone', 'random']

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
    cnpj: 'CNPJ',
    cpf: 'CPF',
    email: 'E-mail',
    phone: 'Telefone',
    random: 'Chave aleatória',
}

const COUNTRY_CODE = '55'
const COUNTRY_CODE_PHONE_LENGTHS = [12, 13]
const CPF_LENGTH = 11
const CNPJ_LENGTH = 14
const CPF_FIRST_WEIGHT = 10
const CNPJ_FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_SECOND_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CHECK_DIGIT_DIVISOR = 11
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RANDOM_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const INVALID_MESSAGES: Record<PixKeyType, string> = {
    cnpj: 'Informe um CNPJ válido.',
    cpf: 'Informe um CPF válido.',
    email: 'Informe um e-mail válido.',
    phone: 'Informe um telefone com DDD.',
    random: 'A chave aleatória tem o formato 123e4567-e89b-12d3-a456-426614174000.',
}

export type PixKeyResult = {
    value: string
    error: string | null
}

function computeCheckDigit(digits: number[], weights: number[]): number {
    const sum = weights.reduce((total, weight, index) => total + weight * digits[index], 0)
    const remainder = sum % CHECK_DIGIT_DIVISOR
    return remainder
}

function toCheckDigit(remainder: number): number {
    const digit = remainder < 2 ? 0 : CHECK_DIGIT_DIVISOR - remainder
    return digit
}

function hasRepeatedDigits(digits: string): boolean {
    const isRepeated = new Set(digits).size === 1
    return isRepeated
}

function isValidCpf(digits: string): boolean {
    if (digits.length !== CPF_LENGTH || hasRepeatedDigits(digits)) {
        return false
    }

    const numbers = digits.split('').map(Number)
    const firstWeights = numbers.slice(0, 9).map((_, index) => CPF_FIRST_WEIGHT - index)
    const secondWeights = numbers.slice(0, 10).map((_, index) => CPF_FIRST_WEIGHT + 1 - index)

    const firstDigit = toCheckDigit(computeCheckDigit(numbers, firstWeights))
    const secondDigit = toCheckDigit(computeCheckDigit(numbers, secondWeights))
    const isValid = firstDigit === numbers[9] && secondDigit === numbers[10]
    return isValid
}

function isValidCnpj(digits: string): boolean {
    if (digits.length !== CNPJ_LENGTH || hasRepeatedDigits(digits)) {
        return false
    }

    const numbers = digits.split('').map(Number)
    const firstDigit = toCheckDigit(computeCheckDigit(numbers, CNPJ_FIRST_WEIGHTS))
    const secondDigit = toCheckDigit(computeCheckDigit(numbers, CNPJ_SECOND_WEIGHTS))
    const isValid = firstDigit === numbers[12] && secondDigit === numbers[13]
    return isValid
}

function normalizeDocument(text: string, isValid: (digits: string) => boolean): { value: string; isValid: boolean } {
    const digits = keepDigits(text)
    return { value: digits, isValid: isValid(digits) }
}

function normalizePhone(text: string): { value: string; isValid: boolean } {
    const digits = keepDigits(text)
    const hasCountryCode = digits.startsWith(COUNTRY_CODE) && COUNTRY_CODE_PHONE_LENGTHS.includes(digits.length)
    const nationalDigits = hasCountryCode ? digits.slice(COUNTRY_CODE.length) : digits
    const isValid = isValidBrazilianPhone(nationalDigits)
    const value = isValid ? `+${COUNTRY_CODE}${nationalDigits}` : nationalDigits
    return { value, isValid }
}

function checkKey(type: PixKeyType, text: string): { value: string; isValid: boolean } {
    const trimmed = text.trim()

    if (type === 'cpf') {
        return normalizeDocument(trimmed, isValidCpf)
    }
    if (type === 'cnpj') {
        return normalizeDocument(trimmed, isValidCnpj)
    }
    if (type === 'phone') {
        return normalizePhone(trimmed)
    }
    if (type === 'email') {
        const email = trimmed.toLowerCase()
        return { value: email, isValid: EMAIL_PATTERN.test(email) && email.length <= PIX_KEY_MAX }
    }

    const randomKey = trimmed.toLowerCase()
    return { value: randomKey, isValid: RANDOM_KEY_PATTERN.test(randomKey) }
}

// CNPJ e CPF viram só dígitos; telefone vira +55 mais DDD e número (aceita com ou sem +55);
// e-mail e chave aleatória ficam em minúsculas.
export function normalizePixKey(type: PixKeyType, text: string): PixKeyResult {
    const checked = checkKey(type, text)
    const error = checked.isValid ? null : INVALID_MESSAGES[type]
    return { value: checked.value, error }
}

// Chave como o cliente a verá: normalizada quando válida, como digitada enquanto incompleta.
export function pixKeyForDisplay(type: PixKeyType | '', text: string): string {
    const trimmed = text.trim()
    if (type === '' || trimmed === '') {
        return trimmed
    }

    const result = normalizePixKey(type, trimmed)
    const display = result.error === null ? result.value : trimmed
    return display
}
