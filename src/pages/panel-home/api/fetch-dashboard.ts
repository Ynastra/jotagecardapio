import { supabase } from '@/shared/api'

import { parseDashboard, type Dashboard } from '../model/dashboard'
import type { PeriodRange } from '../model/home-period'

export async function fetchDashboard(storeId: string, range: PeriodRange): Promise<Dashboard> {
    const { data, error } = await supabase.rpc('get_store_dashboard', {
        target_store: storeId,
        period_start: range.start.toISOString(),
        period_end: range.end.toISOString(),
    })

    if (error) {
        throw new Error(error.message)
    }

    const dashboard = parseDashboard(data as unknown as Parameters<typeof parseDashboard>[0])
    return dashboard
}
