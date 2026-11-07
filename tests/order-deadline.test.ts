import { describe, expect, it } from 'vitest'

import { describeOrderDeadline, formatClockTime } from '@/entities/order'

describe('describeOrderDeadline', () => {
    it('soma o preparo ao horário do pedido no fuso da loja', () => {
        const text = describeOrderDeadline('2026-11-07T22:00:00Z', 40, 'America/Sao_Paulo', 'delivery')

        expect(text).toBe('Entrega até 19:40')
    })

    it('usa o fuso de cada loja', () => {
        const text = describeOrderDeadline('2026-11-07T22:00:00Z', 40, 'America/Manaus', 'pickup')

        expect(text).toBe('Retirada até 18:40')
    })

    it('passa da meia-noite sem virar 24:00', () => {
        const text = describeOrderDeadline('2026-11-08T02:50:00Z', 30, 'America/Sao_Paulo', 'delivery')

        expect(text).toBe('Entrega até 00:20')
    })
})

describe('formatClockTime', () => {
    it('mostra hora e minuto no fuso informado', () => {
        expect(formatClockTime('2026-11-07T22:05:00Z', 'America/Sao_Paulo')).toBe('19:05')
    })
})
