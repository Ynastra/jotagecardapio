import { supabase } from '@/shared/api'

import type { DeliveryZone, ZoneValue } from '../model/zones'

const UNIQUE_VIOLATION_CODE = '23505'

type ZoneRow = {
    id: string
    neighborhood: string
    fee_cents: number
    active: boolean
}

export class DuplicateZoneError extends Error {
    constructor() {
        super('Já existe um bairro com esse nome')
    }
}

function rejectWrite(error: { code?: string }): never {
    if (error.code === UNIQUE_VIOLATION_CODE) {
        throw new DuplicateZoneError()
    }
    throw error
}

export async function fetchZones(storeId: string): Promise<DeliveryZone[]> {
    const { data, error } = await supabase
        .from('delivery_zones')
        .select('id, neighborhood, fee_cents, active')
        .eq('store_id', storeId)
        .order('neighborhood')

    if (error) {
        throw error
    }

    const zones = ((data ?? []) as ZoneRow[]).map((row) => ({
        id: row.id,
        neighborhood: row.neighborhood,
        feeCents: row.fee_cents,
        active: row.active,
    }))
    return zones
}

export async function insertZone(storeId: string, value: ZoneValue): Promise<void> {
    const { error } = await supabase
        .from('delivery_zones')
        .insert({ store_id: storeId, neighborhood: value.neighborhood, fee_cents: value.feeCents })

    if (error) {
        rejectWrite(error)
    }
}

export async function updateZone(zoneId: string, value: ZoneValue): Promise<void> {
    const { error } = await supabase
        .from('delivery_zones')
        .update({ neighborhood: value.neighborhood, fee_cents: value.feeCents })
        .eq('id', zoneId)

    if (error) {
        rejectWrite(error)
    }
}

export async function setZoneActive(zoneId: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('delivery_zones').update({ active }).eq('id', zoneId)

    if (error) {
        throw error
    }
}

export async function deleteZone(zoneId: string): Promise<void> {
    const { error } = await supabase.from('delivery_zones').delete().eq('id', zoneId)

    if (error) {
        throw error
    }
}
