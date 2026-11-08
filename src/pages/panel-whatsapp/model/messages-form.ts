import { fillPlaceholders } from '@/entities/order'

import {
    BODY_MAX,
    DEFAULT_MESSAGES,
    INTERVAL_MAX_HOURS,
    INTERVAL_MIN_HOURS,
    MESSAGE_TYPES,
    MINUTES_PER_HOUR,
    VARIABLES_BY_TYPE,
    type WhatsappMessageType,
} from './message-types'

export type StoredMessage = {
    type: string
    isActive: boolean
    customBody: string | null
    intervalMinutes: number | null
}

export type MessageDraft = {
    isActive: boolean
    customBody: string
}

export type MessagesForm = {
    messages: Record<WhatsappMessageType, MessageDraft>
    greetingIntervalHours: string
}

export type MessagesFieldName = WhatsappMessageType | 'greetingInterval'

export type MessagesFormErrors = Partial<Record<MessagesFieldName, string>>

export type MessageRow = {
    type: WhatsappMessageType
    isActive: boolean
    customBody: string | null
    intervalMinutes: number | null
}

export type MessagesFormResult = {
    errors: MessagesFormErrors
    value: MessageRow[] | null
}

export type PreviewContext = {
    storeName: string
    menuUrl: string
    exampleOrderUrl: string
}

export const EXAMPLE_CUSTOMER_NAME = 'Maria'
export const EXAMPLE_ORDER_CODE = '007-490361'

const VARIABLE_PATTERN = /\{(\w+)\}/g
const WHOLE_NUMBER_PATTERN = /^\d+$/

export function hoursFromMinutes(minutes: number | null): string {
    if (minutes === null) {
        return ''
    }

    const hours = Math.max(INTERVAL_MIN_HOURS, Math.round(minutes / MINUTES_PER_HOUR))
    return String(hours)
}

export function minutesFromHours(hoursText: string): number | null {
    const trimmed = hoursText.trim()
    if (trimmed === '') {
        return null
    }

    const minutes = Number(trimmed) * MINUTES_PER_HOUR
    return minutes
}

export function formFromStored(stored: readonly StoredMessage[]): MessagesForm {
    const messages = {} as Record<WhatsappMessageType, MessageDraft>
    for (const type of MESSAGE_TYPES) {
        const row = stored.find((message) => message.type === type)
        messages[type] = { isActive: row?.isActive ?? true, customBody: row?.customBody ?? '' }
    }

    const greeting = stored.find((message) => message.type === 'greeting')
    const form = { messages, greetingIntervalHours: hoursFromMinutes(greeting?.intervalMinutes ?? null) }
    return form
}

export function isMessagesFormDirty(initial: MessagesForm, current: MessagesForm): boolean {
    const hasChangedMessage = MESSAGE_TYPES.some((type) => {
        const before = initial.messages[type]
        const after = current.messages[type]
        return before.isActive !== after.isActive || before.customBody !== after.customBody
    })
    const hasChangedInterval = initial.greetingIntervalHours !== current.greetingIntervalHours
    const isDirty = hasChangedMessage || hasChangedInterval
    return isDirty
}

function findUnknownVariable(body: string, type: WhatsappMessageType): string | undefined {
    const allowed = VARIABLES_BY_TYPE[type]
    const used = Array.from(body.matchAll(VARIABLE_PATTERN), (match) => match[1])
    const unknown = used.find((name) => !allowed.includes(name))
    return unknown
}

function validateBody(body: string, type: WhatsappMessageType): string | undefined {
    const trimmed = body.trim()
    if (trimmed.length > BODY_MAX) {
        return `Use até ${BODY_MAX} caracteres.`
    }

    const unknown = findUnknownVariable(trimmed, type)
    const error = unknown ? `{${unknown}} não é uma variável desta mensagem.` : undefined
    return error
}

function validateInterval(hoursText: string): string | undefined {
    const trimmed = hoursText.trim()
    if (trimmed === '') {
        return undefined
    }

    const hours = Number(trimmed)
    const isValid = WHOLE_NUMBER_PATTERN.test(trimmed) && hours >= INTERVAL_MIN_HOURS && hours <= INTERVAL_MAX_HOURS
    const error = isValid ? undefined : `Informe de ${INTERVAL_MIN_HOURS} a ${INTERVAL_MAX_HOURS} horas.`
    return error
}

function collectErrors(form: MessagesForm): MessagesFormErrors {
    const errors: MessagesFormErrors = {}
    for (const type of MESSAGE_TYPES) {
        const message = validateBody(form.messages[type].customBody, type)
        if (message) {
            errors[type] = message
        }
    }

    const intervalError = validateInterval(form.greetingIntervalHours)
    if (intervalError) {
        errors.greetingInterval = intervalError
    }
    return errors
}

function buildRows(form: MessagesForm): MessageRow[] {
    const rows = MESSAGE_TYPES.map((type) => {
        const trimmedBody = form.messages[type].customBody.trim()
        const intervalMinutes = type === 'greeting' ? minutesFromHours(form.greetingIntervalHours) : null
        return {
            type,
            isActive: form.messages[type].isActive,
            customBody: trimmedBody === '' ? null : trimmedBody,
            intervalMinutes,
        }
    })
    return rows
}

export function validateMessagesForm(form: MessagesForm): MessagesFormResult {
    const errors = collectErrors(form)
    const hasErrors = Object.keys(errors).length > 0

    const value = hasErrors ? null : buildRows(form)
    return { errors, value }
}

export function buildMessagePreview(type: WhatsappMessageType, body: string, context: PreviewContext): string {
    const trimmed = body.trim()
    const template = trimmed === '' ? DEFAULT_MESSAGES[type] : trimmed
    const preview = fillPlaceholders(template, {
        nome: EXAMPLE_CUSTOMER_NAME,
        loja: context.storeName,
        codigo: EXAMPLE_ORDER_CODE,
        link: context.exampleOrderUrl,
        cardapio: context.menuUrl,
    })
    return preview
}

export type TextInsertion = {
    text: string
    caret: number
}

export function insertAtCursor(text: string, token: string, selectionStart: number, selectionEnd: number): TextInsertion {
    const inserted = `${text.slice(0, selectionStart)}${token}${text.slice(selectionEnd)}`
    return { text: inserted, caret: selectionStart + token.length }
}
