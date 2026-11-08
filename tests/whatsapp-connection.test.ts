import { describe, expect, it } from 'vitest'

import {
    describeConnection,
    formatSessionPhone,
    qrImageSource,
    sessionFromSnapshot,
    shouldPollSession,
} from '@/pages/panel-whatsapp/model/connection'

const TIME_ZONE = 'America/Sao_Paulo'

describe('describeConnection', () => {
    it('sem linha da sessão, o estado é desconectado', () => {
        const view = describeConnection(null, TIME_ZONE)

        expect(view).toEqual({ state: 'disconnected', label: 'Desconectado', phoneText: null, updatedAtText: null })
    })

    it('desconectado não mostra número nem data', () => {
        const session = { state: 'disconnected' as const, phone: '5518996649346', updatedAt: '2026-11-08T15:30:00Z' }

        const view = describeConnection(session, TIME_ZONE)

        expect(view.label).toBe('Desconectado')
        expect(view.phoneText).toBeNull()
        expect(view.updatedAtText).toBeNull()
    })

    it('conectando mostra só o estado', () => {
        const session = { state: 'connecting' as const, phone: null, updatedAt: '2026-11-08T15:30:00Z' }

        const view = describeConnection(session, TIME_ZONE)

        expect(view).toEqual({ state: 'connecting', label: 'Conectando', phoneText: null, updatedAtText: null })
    })

    it('conectado mostra o número formatado e a atualização no fuso da loja', () => {
        const session = { state: 'connected' as const, phone: '5518996649346', updatedAt: '2026-11-08T15:30:00Z' }

        const view = describeConnection(session, TIME_ZONE)

        expect(view.label).toBe('Conectado')
        expect(view.phoneText).toBe('+55 (18) 99664-9346')
        expect(view.updatedAtText).toBe('08/11/2026 às 12:30')
    })

    it('conectado sem número não inventa um', () => {
        const session = { state: 'connected' as const, phone: null, updatedAt: '2026-11-08T15:30:00Z' }

        expect(describeConnection(session, TIME_ZONE).phoneText).toBeNull()
    })
})

describe('sessionFromSnapshot', () => {
    it('guarda estado e número e descarta o QR', () => {
        const snapshot = { state: 'connected' as const, phone: '5518996649346', qr: null }

        const session = sessionFromSnapshot(snapshot, '2026-11-08T15:30:00Z')

        expect(session).toEqual({ state: 'connected', phone: '5518996649346', updatedAt: '2026-11-08T15:30:00Z' })
    })
})

describe('shouldPollSession', () => {
    it('consulta só enquanto conecta', () => {
        expect(shouldPollSession('connecting')).toBe(true)
        expect(shouldPollSession('connected')).toBe(false)
        expect(shouldPollSession('disconnected')).toBe(false)
    })
})

describe('qrImageSource', () => {
    it('monta a imagem a partir do base64', () => {
        expect(qrImageSource('iVBOR')).toBe('data:image/png;base64,iVBOR')
    })

    it('sem QR não há imagem', () => {
        expect(qrImageSource(null)).toBeNull()
    })
})

describe('formatSessionPhone', () => {
    it('mantém número estrangeiro com o sinal de mais', () => {
        expect(formatSessionPhone('351912345678')).toBe('+351912345678')
    })
})
