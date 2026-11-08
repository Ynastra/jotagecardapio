import { describe, expect, it } from 'vitest'

import { shouldSendAutomatically } from '@/pages/panel-orders/model/auto-notify'

describe('shouldSendAutomatically', () => {
    it('envia com a sessão conectada e a mensagem ativa', () => {
        expect(shouldSendAutomatically('connected', 'Seu pedido está sendo preparado!')).toBe(true)
    })

    it.each(['connecting', 'disconnected', null] as const)('não envia com a sessão %s', (sessionState) => {
        expect(shouldSendAutomatically(sessionState, 'Seu pedido está sendo preparado!')).toBe(false)
    })

    it('não envia quando a loja desligou a mensagem do status', () => {
        expect(shouldSendAutomatically('connected', null)).toBe(false)
        expect(shouldSendAutomatically('connected', '')).toBe(false)
    })
})
