import type { ManagedProduct, ProductOptionLink, ProductValues } from '@/entities/product'

export const PRODUCT_NAME_MAX = 120
export const COPY_SUFFIX = ' (cópia)'

export type ProductCopy = {
    values: ProductValues
    position: number
    links: ProductOptionLink[]
}

function buildCopyName(name: string): string {
    const room = PRODUCT_NAME_MAX - COPY_SUFFIX.length
    const copyName = `${name.slice(0, room).trimEnd()}${COPY_SUFFIX}`
    return copyName
}

// A cópia nasce desativada e fora dos destaques, para não aparecer no cardápio
// antes de ser revisada; imagem e vínculos de adicionais são os do original.
export function buildProductCopy(product: ManagedProduct, position: number): ProductCopy {
    const { id: _id, position: _position, optionLinks, ...values } = product
    const copy = {
        values: {
            ...values,
            infoTags: [...values.infoTags],
            allergenTags: [...values.allergenTags],
            name: buildCopyName(values.name),
            active: false,
            featured: false,
        },
        position,
        links: optionLinks.map((link) => ({ ...link })),
    }
    return copy
}
