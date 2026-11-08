import { supabase } from '@/shared/api'

import type { PaymentCoverage } from '../model/store-form'

type CoverageRow = {
    enabled_delivery: boolean
    enabled_pickup: boolean
}

export async function fetchPaymentCoverage(storeId: string): Promise<PaymentCoverage> {
    const { data, error } = await supabase
        .from('store_payment_methods')
        .select('enabled_delivery, enabled_pickup')
        .eq('store_id', storeId)

    if (error) {
        throw error
    }

    const rows = (data ?? []) as CoverageRow[]
    const coverage = {
        delivery: rows.some((row) => row.enabled_delivery),
        pickup: rows.some((row) => row.enabled_pickup),
    }
    return coverage
}
