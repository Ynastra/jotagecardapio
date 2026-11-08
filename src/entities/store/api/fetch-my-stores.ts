import { supabase } from '@/shared/api'

import type { Store } from '../model/types'

type StoreRow = {
    id: string
    name: string
    slug: string
    timezone: string
    prep_time_minutes: number
}

function mapStore(row: StoreRow): Store {
    const store = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        timezone: row.timezone,
        prepTimeMinutes: row.prep_time_minutes,
    }
    return store
}

export async function fetchMyStores(): Promise<Store[]> {
    const { data, error } = await supabase
        .from('store_members')
        .select('stores (id, name, slug, timezone, prep_time_minutes)')

    if (error) {
        throw error
    }

    const rows = (data ?? []) as unknown as { stores: StoreRow | null }[]
    const stores = rows.flatMap((row) => (row.stores ? [mapStore(row.stores)] : []))
    return stores
}
