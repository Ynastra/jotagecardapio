import { supabase } from '@/shared/api'

import type { Store } from '../model/types'

export async function fetchMyStores(): Promise<Store[]> {
    const { data, error } = await supabase.from('store_members').select('stores (id, name, slug, timezone)')

    if (error) {
        throw error
    }

    const rows = (data ?? []) as unknown as { stores: Store | null }[]
    const stores = rows.map((row) => row.stores).filter((store): store is Store => store !== null)
    return stores
}
