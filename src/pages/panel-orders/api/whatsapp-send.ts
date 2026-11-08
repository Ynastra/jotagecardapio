import { supabase } from '@/shared/api'

import type { WhatsappSessionState } from '../model/auto-notify'

export async function fetchWhatsappSessionState(storeId: string): Promise<WhatsappSessionState | null> {
    const { data, error } = await supabase
        .from('store_whatsapp_sessions')
        .select('state')
        .eq('store_id', storeId)
        .maybeSingle()

    if (error) {
        throw error
    }

    const row = data as { state: WhatsappSessionState } | null
    const state = row ? row.state : null
    return state
}

export async function sendWhatsappMessage(storeId: string, orderId: string, text: string): Promise<void> {
    const { error } = await supabase.functions.invoke('whatsapp', {
        body: { action: 'send', store_id: storeId, order_id: orderId, text },
    })

    if (error) {
        throw error
    }
}
