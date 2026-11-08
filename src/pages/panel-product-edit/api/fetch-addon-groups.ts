import { supabase } from '@/shared/api'

export type AddonGroupSummary = {
    id: string
    title: string
    active: boolean
    optionCount: number
}

type GroupRow = {
    id: string
    title: string
    active: boolean
    position: number
    options: { count: number }[]
}

export async function fetchAddonGroupSummaries(storeId: string): Promise<AddonGroupSummary[]> {
    const { data, error } = await supabase
        .from('option_groups')
        .select('id, title, active, position, options(count)')
        .eq('store_id', storeId)
        .order('position')
    if (error) {
        throw error
    }

    const summaries = (data as unknown as GroupRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        active: row.active,
        optionCount: row.options[0]?.count ?? 0,
    }))
    return summaries
}
