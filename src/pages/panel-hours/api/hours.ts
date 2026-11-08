import { supabase } from '@/shared/api'

import type { HourRow, NewHourRow } from '../model/hours'

type HourDbRow = {
    id: string
    weekday: number
    opens_at: string
    closes_at: string
}

export async function fetchHourRows(storeId: string): Promise<HourRow[]> {
    const { data, error } = await supabase
        .from('store_hours')
        .select('id, weekday, opens_at, closes_at')
        .eq('store_id', storeId)

    if (error) {
        throw error
    }

    const rows = ((data ?? []) as HourDbRow[]).map((row) => ({
        id: row.id,
        weekday: row.weekday,
        opensAt: row.opens_at,
        closesAt: row.closes_at,
    }))
    return rows
}

export async function insertHourRows(storeId: string, rows: NewHourRow[]): Promise<void> {
    const records = rows.map((row) => ({
        store_id: storeId,
        weekday: row.weekday,
        opens_at: row.opensAt,
        closes_at: row.closesAt,
    }))
    const { error } = await supabase.from('store_hours').insert(records)

    if (error) {
        throw error
    }
}

export async function deleteHourRows(ids: string[]): Promise<void> {
    const { error } = await supabase.from('store_hours').delete().in('id', ids)

    if (error) {
        throw error
    }
}
