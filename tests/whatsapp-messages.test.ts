import { describe, expect, it } from 'vitest'

import { DEFAULT_MESSAGES } from '@/pages/panel-whatsapp/model/message-types'
import {
    buildMessagePreview,
    formFromStored,
    hoursFromMinutes,
    insertAtCursor,
    isMessagesFormDirty,
    minutesFromHours,
    validateMessagesForm,
    type MessagesForm,
    type PreviewContext,
    type StoredMessage,
} from '@/pages/panel-whatsapp/model/messages-form'

const previewContext: PreviewContext = {
    storeName: 'Zé do Burguer',
    menuUrl: 'https://exemplo.com/ze',
    exampleOrderUrl: 'https://exemplo.com/ze/pedido/exemplo',
}

function buildForm(overrides: Partial<MessagesForm> = {}): MessagesForm {
    const form = { ...formFromStored([]), ...overrides }
    return form
}

function withBody(type: 'greeting' | 'preparing', customBody: string): MessagesForm {
    const base = buildForm()
    const form = { ...base, messages: { ...base.messages, [type]: { isActive: true, customBody } } }
    return form
}

describe('validateMessagesForm', () => {
    it('aceita o formulário padrão e grava texto vazio como nulo', () => {
        const result = validateMessagesForm(buildForm())

        expect(result.errors).toEqual({})
        expect(result.value).toHaveLength(8)
        expect(result.value?.every((row) => row.customBody === null)).toBe(true)
    })

    it('recusa texto acima de 1000 caracteres e aceita exatamente 1000', () => {
        const tooLong = validateMessagesForm(withBody('preparing', 'a'.repeat(1001)))
        const exact = validateMessagesForm(withBody('preparing', 'a'.repeat(1000)))

        expect(tooLong.errors.preparing).toBe('Use até 1000 caracteres.')
        expect(tooLong.value).toBeNull()
        expect(exact.errors.preparing).toBeUndefined()
    })

    it('recusa variável desconhecida', () => {
        const result = validateMessagesForm(withBody('preparing', 'Oi {xyz}'))

        expect(result.errors.preparing).toBe('{xyz} não é uma variável desta mensagem.')
    })

    it('recusa variável fora da lista do tipo', () => {
        const status = validateMessagesForm(withBody('preparing', 'Veja {cardapio}'))
        const greeting = validateMessagesForm(withBody('greeting', 'Oi {nome}'))

        expect(status.errors.preparing).toBe('{cardapio} não é uma variável desta mensagem.')
        expect(greeting.errors.greeting).toBe('{nome} não é uma variável desta mensagem.')
    })

    it('aceita as variáveis do tipo', () => {
        const status = validateMessagesForm(withBody('preparing', '{nome} {loja} {codigo} {link}'))
        const greeting = validateMessagesForm(withBody('greeting', '{loja} {cardapio}'))

        expect(status.errors).toEqual({})
        expect(greeting.errors).toEqual({})
    })

    it('valida o intervalo de 1 a 168 horas, vazio ou inteiro', () => {
        const check = (hours: string) => validateMessagesForm(buildForm({ greetingIntervalHours: hours })).errors
        const message = 'Informe de 1 a 168 horas.'

        expect(check('')).toEqual({})
        expect(check('1')).toEqual({})
        expect(check('168')).toEqual({})
        expect(check('0').greetingInterval).toBe(message)
        expect(check('169').greetingInterval).toBe(message)
        expect(check('1,5').greetingInterval).toBe(message)
        expect(check('-2').greetingInterval).toBe(message)
    })
})

describe('intervalo em horas e minutos', () => {
    it('converte horas em minutos e vazio em nulo', () => {
        expect(minutesFromHours('24')).toBe(1440)
        expect(minutesFromHours('168')).toBe(10080)
        expect(minutesFromHours('  ')).toBeNull()
    })

    it('converte minutos em horas e nulo em vazio', () => {
        expect(hoursFromMinutes(1440)).toBe('24')
        expect(hoursFromMinutes(10080)).toBe('168')
        expect(hoursFromMinutes(30)).toBe('1')
        expect(hoursFromMinutes(null)).toBe('')
    })

    it('grava o intervalo só na saudação', () => {
        const result = validateMessagesForm(buildForm({ greetingIntervalHours: '2' }))

        const intervals = Object.fromEntries((result.value ?? []).map((row) => [row.type, row.intervalMinutes]))
        expect(intervals.greeting).toBe(120)
        expect(intervals.away).toBeNull()
        expect(intervals.canceled).toBeNull()
    })
})

describe('buildMessagePreview', () => {
    it('usa o texto padrão e os dados de exemplo quando o campo está vazio', () => {
        const preview = buildMessagePreview('confirmed', '', previewContext)

        expect(preview).toBe(
            'Olá, Maria! Seu pedido foi confirmado! Por aqui você receberá todas as atualizações. Link do pedido: https://exemplo.com/ze/pedido/exemplo',
        )
    })

    it('preenche saudação com a loja e o link do cardápio', () => {
        const preview = buildMessagePreview('greeting', '  ', previewContext)

        expect(preview).toBe(
            'Boas-vindas à Zé do Burguer! Acesse nosso cardápio e faça seu pedido: https://exemplo.com/ze',
        )
    })

    it('usa o texto personalizado com nome, código e link', () => {
        const preview = buildMessagePreview('canceled', '{nome}, o pedido {codigo}: {link}', previewContext)

        expect(preview).toBe('Maria, o pedido 007-490361: https://exemplo.com/ze/pedido/exemplo')
    })

    it('tem texto padrão para os oito tipos', () => {
        expect(Object.keys(DEFAULT_MESSAGES)).toHaveLength(8)
    })
})

describe('formFromStored e isMessagesFormDirty', () => {
    const stored: StoredMessage[] = [
        { type: 'greeting', isActive: true, customBody: 'Oi {loja}', intervalMinutes: 180 },
        { type: 'canceled', isActive: false, customBody: null, intervalMinutes: null },
    ]

    it('carrega o que foi salvo e assume ativo e vazio para o que falta', () => {
        const form = formFromStored(stored)

        expect(form.messages.greeting).toEqual({ isActive: true, customBody: 'Oi {loja}' })
        expect(form.messages.canceled).toEqual({ isActive: false, customBody: '' })
        expect(form.messages.preparing).toEqual({ isActive: true, customBody: '' })
        expect(form.greetingIntervalHours).toBe('3')
    })

    it('não acusa diferença no formulário recém-carregado', () => {
        const initial = formFromStored(stored)

        expect(isMessagesFormDirty(initial, formFromStored(stored))).toBe(false)
    })

    it('acusa diferença de texto, ativação e intervalo', () => {
        const initial = formFromStored(stored)
        const withText = { ...initial, messages: { ...initial.messages, away: { isActive: true, customBody: 'x' } } }
        const withToggle = { ...initial, messages: { ...initial.messages, away: { isActive: false, customBody: '' } } }
        const withInterval = { ...initial, greetingIntervalHours: '4' }

        expect(isMessagesFormDirty(initial, withText)).toBe(true)
        expect(isMessagesFormDirty(initial, withToggle)).toBe(true)
        expect(isMessagesFormDirty(initial, withInterval)).toBe(true)
    })
})

describe('insertAtCursor', () => {
    it('insere a variável na posição do cursor e move o cursor para depois dela', () => {
        const result = insertAtCursor('Olá , tudo bem', '{nome}', 4, 4)

        expect(result).toEqual({ text: 'Olá {nome}, tudo bem', caret: 10 })
    })

    it('substitui a seleção', () => {
        const result = insertAtCursor('Olá fulano', '{nome}', 4, 10)

        expect(result.text).toBe('Olá {nome}')
    })
})
