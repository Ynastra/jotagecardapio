import { supabase } from '@/shared/api'

import type { AddonGroup, AddonOption } from '../model/addon-group'
import type { GroupValue, OptionValue } from '../model/addon-form'
import type { PositionChange } from '../model/ordering'

type OptionRow = {
    id: string
    group_id: string
    name: string
    description: string | null
    image_url: string | null
    price_cents: number
    max_quantity: number | null
    position: number
    active: boolean
}

type GroupRow = {
    id: string
    title: string
    description: string | null
    active: boolean
    position: number
    options: OptionRow[]
    product_option_groups: { count: number }[]
}

export type PositionedTable = 'option_groups' | 'options'

const GROUP_COLUMNS =
    'id, title, description, active, position, options(id, group_id, name, description, image_url, price_cents, max_quantity, position, active), product_option_groups(count)'

function mapOption(row: OptionRow): AddonOption {
    const option = {
        id: row.id,
        groupId: row.group_id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        priceCents: row.price_cents,
        maxQuantity: row.max_quantity,
        position: row.position,
        active: row.active,
    }
    return option
}

function mapGroup(row: GroupRow): AddonGroup {
    const group = {
        id: row.id,
        title: row.title,
        description: row.description,
        active: row.active,
        position: row.position,
        options: row.options.map(mapOption),
        productCount: row.product_option_groups[0]?.count ?? 0,
    }
    return group
}

function throwOnError(error: Error | null) {
    if (error) {
        throw error
    }
}

export async function fetchAddonGroups(storeId: string): Promise<AddonGroup[]> {
    const { data, error } = await supabase.from('option_groups').select(GROUP_COLUMNS).eq('store_id', storeId)
    throwOnError(error)

    const groups = (data as unknown as GroupRow[]).map(mapGroup)
    return groups
}

export async function createGroup(storeId: string, value: GroupValue, position: number): Promise<void> {
    const { error } = await supabase
        .from('option_groups')
        .insert({ store_id: storeId, title: value.title, description: value.description, position })
    throwOnError(error)
}

export async function updateGroup(groupId: string, value: GroupValue): Promise<void> {
    const { error } = await supabase
        .from('option_groups')
        .update({ title: value.title, description: value.description })
        .eq('id', groupId)
    throwOnError(error)
}

export async function setGroupActive(groupId: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('option_groups').update({ active }).eq('id', groupId)
    throwOnError(error)
}

export async function deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from('option_groups').delete().eq('id', groupId)
    throwOnError(error)
}

function buildOptionColumns(value: OptionValue) {
    const columns = {
        group_id: value.groupId,
        name: value.name,
        description: value.description,
        price_cents: value.priceCents,
        max_quantity: value.maxQuantity,
        image_url: value.imageUrl,
    }
    return columns
}

export async function createOption(storeId: string, value: OptionValue, position: number): Promise<void> {
    const { error } = await supabase
        .from('options')
        .insert({ store_id: storeId, position, ...buildOptionColumns(value) })
    throwOnError(error)
}

export async function updateOption(optionId: string, value: OptionValue): Promise<void> {
    const { error } = await supabase.from('options').update(buildOptionColumns(value)).eq('id', optionId)
    throwOnError(error)
}

export async function setOptionPrice(optionId: string, priceCents: number): Promise<void> {
    const { error } = await supabase.from('options').update({ price_cents: priceCents }).eq('id', optionId)
    throwOnError(error)
}

export async function setOptionActive(optionId: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('options').update({ active }).eq('id', optionId)
    throwOnError(error)
}

export async function deleteOption(optionId: string): Promise<void> {
    const { error } = await supabase.from('options').delete().eq('id', optionId)
    throwOnError(error)
}

export async function savePositions(table: PositionedTable, changes: readonly PositionChange[]): Promise<void> {
    const results = await Promise.all(
        changes.map((change) => supabase.from(table).update({ position: change.position }).eq('id', change.id)),
    )
    for (const result of results) {
        throwOnError(result.error)
    }
}
