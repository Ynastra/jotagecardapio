import { supabase } from '@/shared/api'

import type { ConnectionState, StoredSession } from '../model/connection'

type SessionDbRow = {
    state: ConnectionState
    phone: string | null
    updated_at: string
}

export async function fetchSession(storeId: string): Promise<StoredSession | null> {
    const { data, error } = await supabase
        .from('store_whatsapp_sessions')
        .select('state, phone, updated_at')
        .eq('store_id', storeId)
        .maybeSingle()

    if (error) {
        throw error
    }

    const row = data as SessionDbRow | null
    const session = row ? { state: row.state, phone: row.phone, updatedAt: row.updated_at } : null
    return session
}
