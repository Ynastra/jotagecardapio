import { describe, expect, it } from 'vitest'

import {
    chatIdCandidate,
    mapGatewayStatus,
    phoneFromGatewayId,
    sessionName,
} from '../supabase/functions/whatsapp/session-logic'

describe('sessionName', () => {
    it('prefixa o id da loja', () => {
        expect(sessionName('abc-123')).toBe('store-abc-123')
    })
})

describe('mapGatewayStatus', () => {
    it.each([
        ['WORKING', 'connected'],
        ['STARTING', 'connecting'],
        ['SCAN_QR_CODE', 'connecting'],
        ['STOPPED', 'disconnected'],
        ['FAILED', 'disconnected'],
        [undefined, 'disconnected'],
        [null, 'disconnected'],
    ])('converte %s em %s', (status, expected) => {
        expect(mapGatewayStatus(status)).toBe(expected)
    })
})

describe('phoneFromGatewayId', () => {
    it('tira o número do id do aparelho', () => {
        expect(phoneFromGatewayId('5511999998888:12@c.us')).toBe('5511999998888')
        expect(phoneFromGatewayId('5511999998888@c.us')).toBe('5511999998888')
    })

    it('devolve nulo sem id', () => {
        expect(phoneFromGatewayId(undefined)).toBeNull()
        expect(phoneFromGatewayId('')).toBeNull()
    })
})

describe('chatIdCandidate', () => {
    it('acrescenta o 55 em telefone de 10 ou 11 dígitos', () => {
        expect(chatIdCandidate('(11) 99999-8888')).toBe('5511999998888')
        expect(chatIdCandidate('1133334444')).toBe('551133334444')
    })

    it('mantém telefone que já tem o código do país', () => {
        expect(chatIdCandidate('+55 11 99999-8888')).toBe('5511999998888')
    })

    it('recusa telefone curto ou longo demais', () => {
        expect(chatIdCandidate('99999')).toBeNull()
        expect(chatIdCandidate('551199999888877')).toBeNull()
        expect(chatIdCandidate('')).toBeNull()
    })
})
