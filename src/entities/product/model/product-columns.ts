import type { ProductValues } from './types'

export function buildProductColumns(values: ProductValues) {
    const columns = {
        category_id: values.categoryId,
        name: values.name,
        description: values.description,
        price_cents: values.priceCents,
        promo_price_cents: values.promoPriceCents,
        serves: values.serves,
        portion_amount: values.portionAmount,
        portion_unit: values.portionUnit,
        image_url: values.imageUrl,
        highlight_tag: values.highlightTag,
        info_tags: values.infoTags,
        allergen_tags: values.allergenTags,
        stock: values.stock,
        sell_delivery_pickup: values.sellsDeliveryPickup,
        sell_table: values.sellsTable,
        featured: values.featured,
        active: values.active,
    }
    return columns
}

// O estoque só entra quando o dono o mexeu: regravar o valor carregado desfaria
// as baixas que os pedidos fizeram desde que a tela abriu.
export function buildProductUpdateColumns(values: ProductValues, position: number, loadedStock: number | null) {
    const { stock, ...columns } = buildProductColumns(values)
    const stockChanged = stock !== loadedStock
    const updateColumns = stockChanged ? { position, ...columns, stock } : { position, ...columns }
    return updateColumns
}
