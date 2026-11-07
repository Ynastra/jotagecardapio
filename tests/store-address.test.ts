import { describe, expect, it } from 'vitest'

import { describeStoreAddress } from '@/pages/store-menu/model/store-address'

const base = { address: 'Rua das Flores, 100', city: 'Lucélia', state: 'SP' }

describe('describeStoreAddress', () => {
    it('não mostra nada quando o endereço está oculto', () => {
        expect(describeStoreAddress({ ...base, addressDisplay: 'hidden' })).toBeNull()
    })

    it('mostra só cidade e UF no modo cidade', () => {
        expect(describeStoreAddress({ ...base, addressDisplay: 'city' })).toBe('Lucélia/SP')
    })

    it('mostra endereço e cidade/UF no modo completo', () => {
        expect(describeStoreAddress({ ...base, addressDisplay: 'full' })).toBe('Rua das Flores, 100, Lucélia/SP')
    })

    it('mostra só a cidade quando não há endereço no modo completo', () => {
        expect(describeStoreAddress({ ...base, address: null, addressDisplay: 'full' })).toBe('Lucélia/SP')
    })

    it('devolve nada no modo cidade sem cidade cadastrada', () => {
        expect(describeStoreAddress({ address: null, city: null, state: null, addressDisplay: 'city' })).toBeNull()
    })
})
