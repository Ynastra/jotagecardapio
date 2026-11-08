import { supabase } from '@/shared/api'

import type { MessageRow, StoredMessage } from '../model/messages-form'

type MessageDbRow = {
    type: string
    active: boolean
    custom_body: string | null
    interval_minutes: number | null
}

export async function fetchMessages(storeId: string): Promise<StoredMessage[]> {
    const { data, error } = await supabase
        .from('store_whatsapp_messages')
        .select('type, active, custom_body, interval_minutes')
        .eq('store_id', storeId)

    if (error) {
        throw error
    }

    const rows = (data ?? []) as MessageDbRow[]
    const messages = rows.map((row) => ({
        type: row.type,
        isActive: row.active,
        customBody: row.custom_body,
        intervalMinutes: row.interval_minutes,
    }))
    return messages
}

export async function saveMessages(storeId: string, rows: readonly MessageRow[]): Promise<void> {
    const payload = rows.map((row) => ({
        store_id: storeId,
        type: row.type,
        active: row.isActive,
        custom_body: row.customBody,
        interval_minutes: row.intervalMinutes,
    }))

    const { error } = await supabase.from('store_whatsapp_messages').upsert(payload, { onConflict: 'store_id,type' })
    if (error) {
        throw error
    }
}
