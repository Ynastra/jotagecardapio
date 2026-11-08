import {
    PORTION_UNIT_LABELS,
    type AllergenTag,
    type HighlightTag,
    type InfoTag,
    type ManagedProduct,
    type PortionUnit,
    type Product,
    type ProductOptionLink,
    type ProductValues,
} from '@/entities/product'
import { parseReaisToCents } from '@/shared/lib'

export const NAME_MAX = 120
export const DESCRIPTION_MAX = 600
export const SERVES_MAX = 99
export const MAX_PORTION_AMOUNT = 99_999_999

const CENTS_PER_REAL = 100

export type LinkDraft = {
    groupId: string
    minText: string
    maxText: string
}

export type ProductDraft = {
    active: boolean
    categoryId: string
    imageUrl: string | null
    name: string
    priceText: string
    promoText: string
    portionText: string
    portionUnit: PortionUnit | ''
    servesText: string
    stockText: string
    description: string
    highlightTag: HighlightTag | null
    infoTags: InfoTag[]
    allergenTags: AllergenTag[]
    sellsDeliveryPickup: boolean
    sellsTable: boolean
    featured: boolean
    links: LinkDraft[]
}

export type ProductFieldName =
    | 'categoryId'
    | 'name'
    | 'priceText'
    | 'promoText'
    | 'portionText'
    | 'portionUnit'
    | 'servesText'
    | 'stockText'
    | 'description'

export type LinkErrors = Partial<Record<'minText' | 'maxText', string>>

export type ProductFormErrors = {
    fields: Partial<Record<ProductFieldName, string>>
    links: Record<string, LinkErrors>
}

export type ProductFormValue = {
    values: ProductValues
    links: ProductOptionLink[]
}

export const PREVIEW_NAME_PLACEHOLDER = 'Nome do produto'

function formatDecimalText(value: number): string {
    const text = String(value).replace('.', ',')
    return text
}

function formatPriceText(cents: number): string {
    const text = (cents / CENTS_PER_REAL).toFixed(2).replace('.', ',')
    return text
}

export function createEmptyDraft(categoryId: string): ProductDraft {
    const draft: ProductDraft = {
        active: true,
        categoryId,
        imageUrl: null,
        name: '',
        priceText: '',
        promoText: '',
        portionText: '',
        portionUnit: '',
        servesText: '',
        stockText: '',
        description: '',
        highlightTag: null,
        infoTags: [],
        allergenTags: [],
        sellsDeliveryPickup: true,
        sellsTable: true,
        featured: false,
        links: [],
    }
    return draft
}

export function draftFromProduct(product: ManagedProduct): ProductDraft {
    const links = [...product.optionLinks]
        .sort((first, second) => first.position - second.position)
        .map((link) => ({
            groupId: link.groupId,
            minText: String(link.minChoices),
            maxText: link.maxChoices === null ? '' : String(link.maxChoices),
        }))
    const draft: ProductDraft = {
        active: product.active,
        categoryId: product.categoryId,
        imageUrl: product.imageUrl,
        name: product.name,
        priceText: formatPriceText(product.priceCents),
        promoText: product.promoPriceCents === null ? '' : formatPriceText(product.promoPriceCents),
        portionText: product.portionAmount === null ? '' : formatDecimalText(product.portionAmount),
        portionUnit: product.portionUnit ?? '',
        servesText: product.serves === null ? '' : String(product.serves),
        stockText: product.stock === null ? '' : String(product.stock),
        description: product.description ?? '',
        highlightTag: product.highlightTag,
        infoTags: [...product.infoTags],
        allergenTags: [...product.allergenTags],
        sellsDeliveryPickup: product.sellsDeliveryPickup,
        sellsTable: product.sellsTable,
        featured: product.featured,
        links,
    }
    return draft
}

export function isDraftDirty(initial: ProductDraft, current: ProductDraft): boolean {
    const isDirty = JSON.stringify(initial) !== JSON.stringify(current)
    return isDirty
}

function parseWholeNumber(text: string): number | null {
    const trimmed = text.trim()
    if (!/^\d+$/.test(trimmed)) {
        return null
    }

    const value = Number(trimmed)
    return value
}

function parsePositiveDecimal(text: string): number | null {
    const trimmed = text.trim().replace(',', '.')
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
        return null
    }

    const value = Number(trimmed)
    return value > 0 ? value : null
}

function emptyToNull(text: string): string | null {
    const trimmed = text.trim()
    const value = trimmed === '' ? null : trimmed
    return value
}

type Parsed<Value> = { value: Value; error: string | null }

function validateName(draft: ProductDraft): string | null {
    const name = draft.name.trim()
    if (name === '') {
        return 'Informe o título do produto'
    }

    return name.length > NAME_MAX ? `O título aceita até ${NAME_MAX} caracteres` : null
}

function parsePrice(draft: ProductDraft): Parsed<number | null> {
    if (draft.priceText.trim() === '') {
        return { value: null, error: 'Informe o preço' }
    }

    const cents = parseReaisToCents(draft.priceText)
    return cents === null ? { value: null, error: 'Informe um preço válido' } : { value: cents, error: null }
}

function parsePromo(draft: ProductDraft, priceCents: number | null): Parsed<number | null> {
    if (draft.promoText.trim() === '') {
        return { value: null, error: null }
    }

    const cents = parseReaisToCents(draft.promoText)
    if (cents === null) {
        return { value: null, error: 'Informe um preço válido' }
    }
    if (priceCents !== null && cents >= priceCents) {
        return { value: null, error: 'O desconto tem que ficar abaixo do preço' }
    }

    return { value: cents, error: null }
}

type PortionResult = {
    amount: number | null
    unit: PortionUnit | null
    amountError: string | null
    unitError: string | null
}

function parsePortion(draft: ProductDraft): PortionResult {
    const hasAmount = draft.portionText.trim() !== ''
    const hasUnit = draft.portionUnit !== ''
    const none: PortionResult = { amount: null, unit: null, amountError: null, unitError: null }

    if (!hasAmount && !hasUnit) {
        return none
    }
    if (!hasAmount) {
        return { ...none, amountError: 'Informe a quantidade da medida' }
    }

    const amount = parsePositiveDecimal(draft.portionText)
    if (amount === null || amount > MAX_PORTION_AMOUNT) {
        return { ...none, amountError: 'Informe um número maior que zero' }
    }
    if (!hasUnit) {
        return { ...none, unitError: 'Escolha a unidade da medida' }
    }

    return { amount, unit: draft.portionUnit as PortionUnit, amountError: null, unitError: null }
}

function parseServes(text: string): Parsed<number | null> {
    if (text.trim() === '') {
        return { value: null, error: null }
    }

    const serves = parseWholeNumber(text)
    if (serves === null || serves < 1 || serves > SERVES_MAX) {
        return { value: null, error: `Informe um número de 1 a ${SERVES_MAX}, ou deixe vazio` }
    }

    return { value: serves, error: null }
}

function parseStock(text: string): Parsed<number | null> {
    if (text.trim() === '') {
        return { value: null, error: null }
    }

    const stock = parseWholeNumber(text)
    if (stock === null) {
        return { value: null, error: 'Informe um número inteiro, ou deixe vazio para não controlar' }
    }

    return { value: stock, error: null }
}

function validateLinks(links: readonly LinkDraft[]): {
    errors: Record<string, LinkErrors>
    value: ProductOptionLink[]
} {
    const errors: Record<string, LinkErrors> = {}
    const value: ProductOptionLink[] = []

    links.forEach((link, position) => {
        const linkErrors: LinkErrors = {}
        const min = link.minText.trim() === '' ? 0 : parseWholeNumber(link.minText)
        const max = link.maxText.trim() === '' ? null : parseWholeNumber(link.maxText)

        if (min === null) {
            linkErrors.minText = 'Informe um número inteiro a partir de 0'
        }
        if (max !== null && max < 1) {
            linkErrors.maxText = 'O máximo é a partir de 1, ou vazio para sem limite'
        } else if (link.maxText.trim() !== '' && max === null) {
            linkErrors.maxText = 'Informe um número inteiro, ou deixe vazio'
        } else if (min !== null && max !== null && max < min) {
            linkErrors.maxText = 'O máximo tem que ser maior ou igual ao mínimo'
        }

        if (Object.keys(linkErrors).length > 0) {
            errors[link.groupId] = linkErrors
        } else {
            value.push({ groupId: link.groupId, position, minChoices: min ?? 0, maxChoices: max })
        }
    })
    return { errors, value }
}

export function validateProductDraft(draft: ProductDraft): { errors: ProductFormErrors; value: ProductFormValue | null } {
    const fields: ProductFormErrors['fields'] = {}
    const description = draft.description.trim()
    const price = parsePrice(draft)
    const promo = parsePromo(draft, price.value)
    const portion = parsePortion(draft)
    const serves = parseServes(draft.servesText)
    const stock = parseStock(draft.stockText)
    const links = validateLinks(draft.links)

    const candidates: [ProductFieldName, string | null][] = [
        ['categoryId', draft.categoryId === '' ? 'Escolha a categoria' : null],
        ['name', validateName(draft)],
        ['priceText', price.error],
        ['promoText', promo.error],
        ['portionText', portion.amountError],
        ['portionUnit', portion.unitError],
        ['servesText', serves.error],
        ['stockText', stock.error],
        ['description', description.length > DESCRIPTION_MAX ? `A descrição aceita até ${DESCRIPTION_MAX} caracteres` : null],
    ]
    for (const [field, message] of candidates) {
        if (message) {
            fields[field] = message
        }
    }

    const errors: ProductFormErrors = { fields, links: links.errors }
    if (Object.keys(fields).length > 0 || Object.keys(links.errors).length > 0 || price.value === null) {
        return { errors, value: null }
    }

    const values: ProductValues = {
        categoryId: draft.categoryId,
        name: draft.name.trim(),
        description: emptyToNull(description),
        priceCents: price.value,
        promoPriceCents: promo.value,
        serves: serves.value,
        portionAmount: portion.amount,
        portionUnit: portion.unit,
        imageUrl: draft.imageUrl,
        highlightTag: draft.highlightTag,
        infoTags: draft.infoTags,
        allergenTags: draft.allergenTags,
        stock: stock.value,
        sellsDeliveryPickup: draft.sellsDeliveryPickup,
        sellsTable: draft.sellsTable,
        featured: draft.featured,
        active: draft.active,
    }
    return { errors, value: { values, links: links.value } }
}

// Prévia tolerante: campo ainda inválido vira o valor neutro, para o cartão
// acompanhar a digitação sem esperar o formulário fechar.
export function buildPreviewProduct(draft: ProductDraft): Product {
    const priceCents = parseReaisToCents(draft.priceText) ?? 0
    const promoCents = draft.promoText.trim() === '' ? null : parseReaisToCents(draft.promoText)
    const portion = parsePortion(draft)
    const stock = parseStock(draft.stockText)
    const serves = parseServes(draft.servesText)

    const preview: Product = {
        id: 'previa',
        categoryId: draft.categoryId,
        name: draft.name.trim() === '' ? PREVIEW_NAME_PLACEHOLDER : draft.name.trim(),
        description: emptyToNull(draft.description),
        priceCents,
        promoPriceCents: promoCents !== null && promoCents < priceCents ? promoCents : null,
        serves: serves.value,
        portionLabel:
            portion.amount !== null && portion.unit !== null
                ? `${portion.amount.toLocaleString('pt-BR')} ${PORTION_UNIT_LABELS[portion.unit]}`
                : null,
        imageUrl: draft.imageUrl,
        featured: draft.featured,
        active: draft.active,
        stock: stock.value,
        sellsDeliveryPickup: draft.sellsDeliveryPickup,
        optionGroups: [],
    }
    return preview
}

export function setLinkRequired(link: LinkDraft, required: boolean): LinkDraft {
    if (!required) {
        return { ...link, minText: '0' }
    }

    const min = parseWholeNumber(link.minText)
    const next = { ...link, minText: String(Math.max(1, min ?? 1)) }
    return next
}

export function isLinkRequired(link: LinkDraft): boolean {
    const min = parseWholeNumber(link.minText)
    const isRequired = min !== null && min >= 1
    return isRequired
}

export function moveItem<Item>(items: readonly Item[], index: number, direction: 'up' | 'down'): Item[] {
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= items.length) {
        return [...items]
    }

    const reordered = [...items]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    return reordered
}
