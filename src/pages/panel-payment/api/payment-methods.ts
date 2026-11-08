import type { PaymentMethod } from '@/entities/order'
import { supabase } from '@/shared/api'

import type { FeeKind, MethodRule } from '../model/payment-form'

type RuleRow = {
    method: PaymentMethod
    enabled_delivery: boolean
    enabled_pickup: boolean
    fee_kind: FeeKind
    fee_percent: number
    fee_fixed_cents: number
}

export async function fetchMethodRules(storeId: string): Promise<MethodRule[]> {
    const { data, error } = await supabase
        .from('store_payment_methods')
        .select('method, enabled_delivery, enabled_pickup, fee_kind, fee_percent, fee_fixed_cents')
        .eq('store_id', storeId)

    if (error) {
        throw error
    }

    const rules = ((data ?? []) as RuleRow[]).map((row) => ({
        method: row.method,
        enabledDelivery: row.enabled_delivery,
        enabledPickup: row.enabled_pickup,
        feeKind: row.fee_kind,
        feePercent: Number(row.fee_percent),
        feeFixedCents: row.fee_fixed_cents,
    }))
    return rules
}

export async function saveMethodRules(storeId: string, rules: readonly MethodRule[]): Promise<void> {
    const records = rules.map((rule) => ({
        store_id: storeId,
        method: rule.method,
        enabled_delivery: rule.enabledDelivery,
        enabled_pickup: rule.enabledPickup,
        fee_kind: rule.feeKind,
        fee_percent: rule.feePercent,
        fee_fixed_cents: rule.feeFixedCents,
    }))
    const { error } = await supabase.from('store_payment_methods').upsert(records, { onConflict: 'store_id,method' })

    if (error) {
        throw error
    }
}
