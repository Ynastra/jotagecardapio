import type { StoredStatusMessage } from '@/entities/order'
import { supabase } from '@/shared/api'

type StatusMessageRow = {
    type: string
    active: boolean
    custom_body: string | null
}

export async function fetchStatusMessages(storeId: string): Promise<StoredStatusMessage[]> {
    const { data, error } = await supabase
        .from('store_whatsapp_messages')
        .select('type, active, custom_body')
        .eq('store_id', storeId)

    if (error) {
        throw error
    }

    const rows = (data ?? []) as StatusMessageRow[]
    const messages = rows.map((row) => ({ type: row.type, isActive: row.active, customBody: row.custom_body }))
    return messages
}
