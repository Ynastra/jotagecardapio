import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { ProductCard } from '@/entities/product'
import { useCurrentStore } from '@/entities/store'
import { Button, StatusMessage } from '@/shared/ui'

import { buildPreviewProduct } from '../model/product-form'
import { useProductEditor } from '../model/use-product-editor'
import { AddonLinksSection } from './AddonLinksSection'
import { BasicSection } from './BasicSection'
import { CategorySheet } from './CategorySheet'
import { ConfirmSheet } from './ConfirmSheet'
import { DetailsSection } from './DetailsSection'
import styles from './product-edit.module.css'

const PRODUCTS_PATH = '/painel/produtos'
const ADDONS_SECTION_PARAM = 'adicionais'

type SheetKind = 'category' | 'leave' | 'delete'

function ignoreOpen() {
    // A prévia só mostra o cartão; abrir o produto não faz parte dela.
}

export function ProductEditPage() {
    const store = useCurrentStore()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const editor = useProductEditor(store.id, id ?? null, searchParams.get('categoria'))
    const [sheet, setSheet] = useState<SheetKind | null>(null)
    const [isSaved, setSaved] = useState(false)
    const preview = useMemo(() => buildPreviewProduct(editor.draft), [editor.draft])
    const shouldShowAddons = searchParams.get('secao') === ADDONS_SECTION_PARAM

    useEffect(() => {
        document.title = `${editor.isNew ? 'Novo produto' : 'Editar produto'} · ${store.name}`
    }, [editor.isNew, store.name])

    useEffect(() => {
        if (editor.status === 'ready' && shouldShowAddons) {
            document.getElementById('secao-adicionais')?.scrollIntoView({ block: 'start' })
        }
    }, [editor.status, shouldShowAddons])

    useEffect(() => {
        if (!editor.isDirty) {
            return undefined
        }

        function warnBeforeUnload(event: BeforeUnloadEvent) {
            event.preventDefault()
        }

        window.addEventListener('beforeunload', warnBeforeUnload)
        return () => window.removeEventListener('beforeunload', warnBeforeUnload)
    }, [editor.isDirty])

    function goBack() {
        if (editor.isDirty) {
            setSheet('leave')
            return
        }

        navigate(PRODUCTS_PATH)
    }

    async function save() {
        setSaved(false)
        const savedId = await editor.save()
        if (savedId === null) {
            return
        }

        if (editor.isNew) {
            navigate(`${PRODUCTS_PATH}/${savedId}`, { replace: true })
        } else {
            setSaved(true)
        }
    }

    async function confirmDelete() {
        const deleted = await editor.remove()
        if (deleted) {
            navigate(PRODUCTS_PATH)
        }
    }

    if (editor.status === 'loading') {
        return <p className={styles.muted}>Carregando produto</p>
    }

    if (editor.status === 'failed') {
        return (
            <StatusMessage illustration="painel-sem-pedidos" title="Não deu para abrir o produto">
                <p>{editor.errorMessage}</p>
                <Button onClick={() => navigate(PRODUCTS_PATH)}>Voltar para Produtos</Button>
            </StatusMessage>
        )
    }

    if (editor.status === 'not-found') {
        return (
            <StatusMessage illustration="painel-sem-pedidos" title="Produto não encontrado">
                <p>Ele pode ter sido excluído.</p>
                <Button onClick={() => navigate(PRODUCTS_PATH)}>Voltar para Produtos</Button>
            </StatusMessage>
        )
    }

    function renderSheet() {
        if (sheet === 'category') {
            return <CategorySheet onSave={editor.addCategory} onClose={() => setSheet(null)} />
        }

        if (sheet === 'leave') {
            return (
                <ConfirmSheet
                    title="Descartar alterações"
                    message="Há alterações que não foram salvas. Se você voltar agora, elas se perdem."
                    confirmLabel="Descartar e voltar"
                    cancelLabel="Continuar editando"
                    onConfirm={() => navigate(PRODUCTS_PATH)}
                    onClose={() => setSheet(null)}
                />
            )
        }

        if (sheet === 'delete') {
            return (
                <ConfirmSheet
                    title="Excluir produto"
                    message="O produto some do cardápio e dos destaques."
                    confirmLabel="Excluir produto"
                    onConfirm={confirmDelete}
                    onClose={() => setSheet(null)}
                />
            )
        }

        return null
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Button variant="ghost" onClick={goBack}>
                    Voltar
                </Button>
                <h1 className={styles.title}>{editor.isNew ? 'Novo produto' : 'Editar produto'}</h1>
            </div>

            {editor.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{editor.errorMessage}</p>
                    <Button variant="ghost" onClick={editor.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}

            <div className={styles.layout}>
                <div className={styles.main}>
                    <BasicSection
                        storeId={store.id}
                        draft={editor.draft}
                        errors={editor.errors.fields}
                        categories={editor.categories}
                        onChange={editor.update}
                        onCreateCategory={() => setSheet('category')}
                    />
                    <DetailsSection draft={editor.draft} errors={editor.errors.fields} onChange={editor.update} />
                    <AddonLinksSection
                        links={editor.draft.links}
                        groups={editor.groups}
                        errors={editor.errors.links}
                        editor={editor}
                    />

                    <div className={styles.footer}>
                        <Button onClick={save} disabled={editor.isSaving}>
                            Salvar
                        </Button>
                        {isSaved && !editor.isDirty ? <span role="status">Produto salvo</span> : null}
                        {editor.isNew ? null : (
                            <Button variant="secondary" onClick={() => setSheet('delete')}>
                                Excluir produto
                            </Button>
                        )}
                    </div>
                </div>

                <aside className={styles.preview} aria-label="Prévia no cardápio">
                    <span className={styles.previewLabel}>Como o cliente vê no cardápio</span>
                    <div className={styles.previewFrame}>
                        <ProductCard product={preview} onOpen={ignoreOpen} />
                    </div>
                </aside>
            </div>

            {renderSheet()}
        </div>
    )
}
