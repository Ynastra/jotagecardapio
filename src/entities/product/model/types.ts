import type { AllergenTag, HighlightTag, InfoTag, PortionUnit } from './tags'

export type ProductOption = {
    id: string
    name: string
    description: string | null
    imageUrl?: string | null
    priceCents: number
    // null = sem limite por item.
    maxQuantity: number | null
}

export type OptionGroup = {
    id: string
    title: string
    minChoices: number
    // null = sem limite de unidades no grupo.
    maxChoices: number | null
    options: ProductOption[]
}

export type Product = {
    id: string
    categoryId: string
    name: string
    description: string | null
    priceCents: number
    promoPriceCents: number | null
    serves: number | null
    portionLabel: string | null
    imageUrl: string | null
    featured: boolean
    active: boolean
    // null = sem controle de estoque.
    stock: number | null
    sellsDeliveryPickup: boolean
    optionGroups: OptionGroup[]
}

// Campos que o painel grava no produto, na forma que a tela edita.
export type ProductValues = {
    categoryId: string
    name: string
    description: string | null
    priceCents: number
    promoPriceCents: number | null
    serves: number | null
    portionAmount: number | null
    portionUnit: PortionUnit | null
    imageUrl: string | null
    highlightTag: HighlightTag | null
    infoTags: InfoTag[]
    allergenTags: AllergenTag[]
    // null = sem controle de estoque.
    stock: number | null
    sellsDeliveryPickup: boolean
    sellsTable: boolean
    featured: boolean
    active: boolean
}

export type ProductOptionLink = {
    groupId: string
    position: number
    minChoices: number
    // null = sem limite de unidades no grupo.
    maxChoices: number | null
}

export type ManagedProduct = ProductValues & {
    id: string
    position: number
    optionLinks: ProductOptionLink[]
}

export type ManagedCategory = {
    id: string
    name: string
    active: boolean
    position: number
}
