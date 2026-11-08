import { useCallback, useEffect, useMemo, useState } from 'react'

import {
    createCategory,
    createProduct,
    deleteCategory,
    deleteProduct,
    fetchCatalog,
    isFeaturedLimitError,
    renameCategory,
    savePositions,
    setCategoryActive,
    setProductActive,
    setProductFeatured,
    setProductPrice,
    setProductPromoPrice,
    type ManagedCategory,
    type ManagedProduct,
} from '@/entities/product'

import { buildCatalog, FEATURED_LIMIT_MESSAGE, selectFeatured, type CatalogCategory } from './catalog'
import { buildProductCopy } from './duplicate'
import { nextPosition, planMove, type MoveDirection } from './ordering'
import { resolvePriceEdit, resolvePromoEdit, type PriceEdit } from './price-edit'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar os produtos. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export type CatalogState = {
    catalog: CatalogCategory[]
    featured: ManagedProduct[]
    isLoading: boolean
    errorMessage: string | null
    showError: (message: string) => void
    dismissError: () => void
    addCategory: (name: string) => Promise<boolean>
    editCategory: (categoryId: string, name: string) => Promise<boolean>
    toggleCategory: (categoryId: string, active: boolean) => Promise<boolean>
    removeCategory: (categoryId: string) => Promise<boolean>
    moveCategory: (categoryId: string, direction: MoveDirection) => Promise<boolean>
    changePrice: (product: ManagedProduct, text: string) => Promise<string | null>
    changePromoPrice: (product: ManagedProduct, text: string) => Promise<string | null>
    toggleProduct: (productId: string, active: boolean) => Promise<boolean>
    setFeatured: (productId: string, featured: boolean) => Promise<boolean>
    addFeatured: (productIds: readonly string[]) => Promise<boolean>
    removeProduct: (productId: string) => Promise<boolean>
    moveProduct: (product: ManagedProduct, direction: MoveDirection) => Promise<boolean>
    duplicateProduct: (product: ManagedProduct) => Promise<boolean>
}

export function useCatalog(storeId: string): CatalogState {
    const [categories, setCategories] = useState<ManagedCategory[]>([])
    const [products, setProducts] = useState<ManagedProduct[]>([])
    const [isLoading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const catalog = useMemo(() => buildCatalog(categories, products), [categories, products])
    const featured = useMemo(() => selectFeatured(products), [products])

    const reload = useCallback(async () => {
        const loaded = await fetchCatalog(storeId)
        setCategories(loaded.categories)
        setProducts(loaded.products)
    }, [storeId])

    useEffect(() => {
        let isCurrent = true
        setLoading(true)

        reload()
            .catch((error: unknown) => {
                console.error('Falha ao carregar produtos', error)
                if (isCurrent) {
                    setErrorMessage(LOAD_FAILED_MESSAGE)
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false)
                }
            })

        return () => {
            isCurrent = false
        }
    }, [reload])

    async function perform(action: () => Promise<void>): Promise<boolean> {
        try {
            await action()
            await reload()
            setErrorMessage(null)
            return true
        } catch (error) {
            console.error('Falha ao salvar produtos', error)
            setErrorMessage(isFeaturedLimitError(error) ? FEATURED_LIMIT_MESSAGE : SAVE_FAILED_MESSAGE)
            return false
        }
    }

    // Devolve a mensagem de erro do campo, ou null quando gravou ou nada mudou.
    async function applyPriceEdit<Value>(edit: PriceEdit<Value>, write: (value: Value) => Promise<void>) {
        if (edit.kind === 'invalid') {
            return edit.error
        }
        if (edit.kind === 'unchanged') {
            return null
        }

        const saved = await perform(() => write(edit.value))
        return saved ? null : SAVE_FAILED_MESSAGE
    }

    const addCategory = (name: string) => perform(() => createCategory(storeId, name, nextPosition(categories)))
    const editCategory = (categoryId: string, name: string) => perform(() => renameCategory(categoryId, name))
    const toggleCategory = (categoryId: string, active: boolean) => perform(() => setCategoryActive(categoryId, active))
    const removeCategory = (categoryId: string) => perform(() => deleteCategory(categoryId))
    const moveCategory = (categoryId: string, direction: MoveDirection) =>
        perform(() => savePositions('categories', planMove(categories, categoryId, direction)))

    const changePrice = (product: ManagedProduct, text: string) =>
        applyPriceEdit(resolvePriceEdit(text, product), (cents) => setProductPrice(product.id, cents))
    const changePromoPrice = (product: ManagedProduct, text: string) =>
        applyPriceEdit(resolvePromoEdit(text, product), (cents) => setProductPromoPrice(product.id, cents))
    const toggleProduct = (productId: string, active: boolean) => perform(() => setProductActive(productId, active))
    const setFeatured = (productId: string, featured: boolean) => perform(() => setProductFeatured(productId, featured))
    const removeProduct = (productId: string) => perform(() => deleteProduct(productId))

    // Em sequência, para o gatilho do banco contar um destaque por vez.
    const addFeatured = (productIds: readonly string[]) =>
        perform(async () => {
            for (const productId of productIds) {
                await setProductFeatured(productId, true)
            }
        })

    function moveProduct(product: ManagedProduct, direction: MoveDirection) {
        const siblings = products.filter((candidate) => candidate.categoryId === product.categoryId)
        return perform(() => savePositions('products', planMove(siblings, product.id, direction)))
    }

    function duplicateProduct(product: ManagedProduct) {
        const siblings = products.filter((candidate) => candidate.categoryId === product.categoryId)
        const copy = buildProductCopy(product, nextPosition(siblings))
        return perform(() => createProduct(storeId, copy.values, copy.position, copy.links))
    }

    return {
        catalog,
        featured,
        isLoading,
        errorMessage,
        showError: setErrorMessage,
        dismissError: () => setErrorMessage(null),
        addCategory,
        editCategory,
        toggleCategory,
        removeCategory,
        moveCategory,
        changePrice,
        changePromoPrice,
        toggleProduct,
        setFeatured,
        addFeatured,
        removeProduct,
        moveProduct,
        duplicateProduct,
    }
}
