export const HIGHLIGHT_TAG_LABELS = {
    new: 'Novidade',
    best_seller: 'Mais vendido',
    promo: 'Promoção',
} as const

export const INFO_TAG_LABELS = {
    cold_drink: 'Bebida gelada',
    alcoholic: 'Bebida alcoólica +18',
    vegan: 'Vegano',
    vegetarian: 'Vegetariano',
    hot_dish: 'Prato quente',
    sugar_free: 'Sem açúcar',
    lactose_free: 'Sem lactose',
    gluten_free: 'Sem glúten',
} as const

export const ALLERGEN_TAG_LABELS = {
    contains_gluten: 'Contém glúten',
    contains_lactose: 'Contém lactose',
    contains_peanut: 'Contém amendoim',
    contains_seafood: 'Contém frutos do mar',
} as const

export const PORTION_UNIT_LABELS = {
    g: 'g',
    kg: 'kg',
    l: 'l',
    ml: 'ml',
    un: 'un',
    capsulas: 'cápsulas',
    fatias: 'fatias',
} as const

export type HighlightTag = keyof typeof HIGHLIGHT_TAG_LABELS
export type InfoTag = keyof typeof INFO_TAG_LABELS
export type AllergenTag = keyof typeof ALLERGEN_TAG_LABELS
export type PortionUnit = keyof typeof PORTION_UNIT_LABELS
