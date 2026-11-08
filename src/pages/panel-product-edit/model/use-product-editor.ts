import { useCallback, useEffect, useState } from 'react'

import {
    createCategory,
    createProduct,
    deleteProduct,
    fetchCatalog,
    updateProduct,
    type ManagedCategory,
    type ManagedProduct,
} from '@/entities/product'

import { fetchAddonGroupSummaries, type AddonGroupSummary } from '../api/fetch-addon-groups'
import {
    createEmptyDraft,
    draftFromProduct,
    isDraftDirty,
    moveItem,
    setLinkRequired,
    validateProductDraft,
    type LinkDraft,
    type ProductDraft,
    type ProductFormErrors,
} from './product-form'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar o produto. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export type EditorStatus = 'loading' | 'ready' | 'not-found' | 'failed'

const NO_ERRORS: ProductFormErrors = { fields: {}, links: {} }

type EditorData = {
    categories: ManagedCategory[]
    products: ManagedProduct[]
    groups: AddonGroupSummary[]
    product: ManagedProduct | null
}

function nextPositionIn(products: readonly ManagedProduct[], categoryId: string): number {
    const positions = products.filter((product) => product.categoryId === categoryId).map((product) => product.position)
    const next = Math.max(-1, ...positions) + 1
    return next
}

export function useProductEditor(storeId: string, productId: string | null, defaultCategoryId: string | null) {
    const [status, setStatus] = useState<EditorStatus>('loading')
    const [data, setData] = useState<EditorData | null>(null)
    const [initial, setInitial] = useState<ProductDraft>(createEmptyDraft(''))
    const [draft, setDraft] = useState<ProductDraft>(createEmptyDraft(''))
    const [errors, setErrors] = useState<ProductFormErrors>(NO_ERRORS)
    const [isSaving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const load = useCallback(async () => {
        const [catalog, groups] = await Promise.all([fetchCatalog(storeId), fetchAddonGroupSummaries(storeId)])
        const product = productId === null ? null : (catalog.products.find((candidate) => candidate.id === productId) ?? null)
        setData({ categories: catalog.categories, products: catalog.products, groups, product })

        if (productId !== null && product === null) {
            setStatus('not-found')
            return
        }

        const loadedDraft = product ? draftFromProduct(product) : createEmptyDraft(defaultCategoryId ?? '')
        setInitial(loadedDraft)
        setDraft(loadedDraft)
        setStatus('ready')
    }, [storeId, productId, defaultCategoryId])

    useEffect(() => {
        let isCurrent = true

        load().catch((error: unknown) => {
            console.error('Falha ao carregar produto', error)
            if (isCurrent) {
                setStatus('failed')
                setErrorMessage(LOAD_FAILED_MESSAGE)
            }
        })

        return () => {
            isCurrent = false
        }
    }, [load])

    const update = useCallback((patch: Partial<ProductDraft>) => {
        setDraft((current) => ({ ...current, ...patch }))
    }, [])

    function updateLinks(change: (links: LinkDraft[]) => LinkDraft[]) {
        setDraft((current) => ({ ...current, links: change(current.links) }))
    }

    function addLinks(groupIds: readonly string[]) {
        const fresh = groupIds.map((groupId) => ({ groupId, minText: '0', maxText: '' }))
        updateLinks((links) => [...links, ...fresh])
    }

    function removeLink(groupId: string) {
        updateLinks((links) => links.filter((link) => link.groupId !== groupId))
    }

    function moveLink(groupId: string, direction: 'up' | 'down') {
        updateLinks((links) =>
            moveItem(
                links,
                links.findIndex((link) => link.groupId === groupId),
                direction,
            ),
        )
    }

    function changeLink(groupId: string, patch: Partial<Pick<LinkDraft, 'minText' | 'maxText'>>) {
        updateLinks((links) => links.map((link) => (link.groupId === groupId ? { ...link, ...patch } : link)))
    }

    function toggleLinkRequired(groupId: string, required: boolean) {
        updateLinks((links) => links.map((link) => (link.groupId === groupId ? setLinkRequired(link, required) : link)))
    }

    async function addCategory(name: string): Promise<boolean> {
        if (!data) {
            return false
        }

        try {
            const position = Math.max(-1, ...data.categories.map((category) => category.position)) + 1
            const categoryId = await createCategory(storeId, name, position)
            const catalog = await fetchCatalog(storeId)
            setData({ ...data, categories: catalog.categories, products: catalog.products })
            update({ categoryId })
            return true
        } catch (error) {
            console.error('Falha ao criar categoria', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return false
        }
    }

    // Devolve o id do produto salvo, ou null quando a validação ou o banco recusou.
    async function save(): Promise<string | null> {
        const result = validateProductDraft(draft)
        setErrors(result.errors)
        if (!result.value || !data) {
            return null
        }

        const { values, links } = result.value
        const { product, products } = data
        setSaving(true)
        try {
            const savedId = product
                ? await saveExisting(product, products)
                : await createProduct(storeId, values, nextPositionIn(products, values.categoryId), links)
            setInitial(draft)
            setErrorMessage(null)
            return savedId
        } catch (error) {
            console.error('Falha ao salvar produto', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return null
        } finally {
            setSaving(false)
        }

        async function saveExisting(existing: ManagedProduct, all: readonly ManagedProduct[]) {
            const position =
                existing.categoryId === values.categoryId ? existing.position : nextPositionIn(all, values.categoryId)
            await updateProduct(storeId, existing, values, position, links)
            await load()
            return existing.id
        }
    }

    async function remove(): Promise<boolean> {
        if (!data?.product) {
            return false
        }

        try {
            await deleteProduct(data.product.id)
            return true
        } catch (error) {
            console.error('Falha ao excluir produto', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return false
        }
    }

    return {
        status,
        isNew: productId === null,
        categories: data?.categories ?? [],
        groups: data?.groups ?? [],
        draft,
        errors,
        isDirty: isDraftDirty(initial, draft),
        isSaving,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        update,
        addLinks,
        removeLink,
        moveLink,
        changeLink,
        toggleLinkRequired,
        addCategory,
        save,
        remove,
    }
}

export type ProductEditor = ReturnType<typeof useProductEditor>
