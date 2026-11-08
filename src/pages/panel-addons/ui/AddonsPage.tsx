import { useEffect, useState } from 'react'

import { useCurrentStore } from '@/entities/store'
import { Button, ConfirmSheet, StatusMessage } from '@/shared/ui'

import { describeItemCount, describeUsage, filterGroupsBySearch, type AddonGroup, type AddonOption } from '../model/addon-group'
import { useAddons } from '../model/use-addons'
import { GroupBlock } from './GroupBlock'
import { GroupSheet } from './GroupSheet'
import { OptionSheet } from './OptionSheet'
import styles from './addons.module.css'

type SheetState =
    | { kind: 'group'; group: AddonGroup | null }
    | { kind: 'option'; option: AddonOption | null; groupId: string }
    | { kind: 'delete-group'; group: AddonGroup }
    | { kind: 'delete-option'; option: AddonOption }

function jumpToGroup(groupId: string) {
    document.getElementById(`grupo-${groupId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function buildDeleteGroupMessage(group: AddonGroup): string {
    const usage = describeUsage(group.productCount)
    const consequence = 'Os itens do grupo também serão excluídos.'
    const message = usage ? `${usage}. ${consequence}` : consequence
    return message
}

export function AddonsPage() {
    const store = useCurrentStore()
    const addons = useAddons(store.id)
    const [search, setSearch] = useState('')
    const [sheet, setSheet] = useState<SheetState | null>(null)
    const [isDeleting, setDeleting] = useState(false)
    const visibleGroups = filterGroupsBySearch(addons.groups, search)
    const hasNoGroups = !addons.isLoading && addons.groups.length === 0

    useEffect(() => {
        document.title = `Adicionais · ${store.name}`
    }, [store.name])

    function closeSheet() {
        setSheet(null)
    }

    async function confirmDelete() {
        if (sheet?.kind !== 'delete-group' && sheet?.kind !== 'delete-option') {
            return
        }

        setDeleting(true)
        const deleted =
            sheet.kind === 'delete-group'
                ? await addons.removeGroup(sheet.group.id)
                : await addons.removeOption(sheet.option.id)
        setDeleting(false)
        if (deleted) {
            closeSheet()
        }
    }

    function renderSheet() {
        if (!sheet) {
            return null
        }

        if (sheet.kind === 'group') {
            const { group } = sheet
            const save = (value: Parameters<typeof addons.addGroup>[0]) =>
                group ? addons.editGroup(group.id, value) : addons.addGroup(value)
            return <GroupSheet group={group} onSave={save} onClose={closeSheet} />
        }

        if (sheet.kind === 'option') {
            const { option } = sheet
            const save = (value: Parameters<typeof addons.addOption>[0]) =>
                option ? addons.editOption(option.id, value) : addons.addOption(value)
            return (
                <OptionSheet
                    storeId={store.id}
                    groups={addons.groups}
                    option={option}
                    defaultGroupId={sheet.groupId}
                    onSave={save}
                    onClose={closeSheet}
                />
            )
        }

        if (sheet.kind === 'delete-group') {
            return (
                <ConfirmSheet
                    title={`Excluir ${sheet.group.title}`}
                    message={buildDeleteGroupMessage(sheet.group)}
                    confirmLabel="Excluir grupo"
                    isPending={isDeleting}
                    onConfirm={confirmDelete}
                    onClose={closeSheet}
                />
            )
        }

        return (
            <ConfirmSheet
                title={`Excluir ${sheet.option.name}`}
                message="O item some do grupo e dos produtos que usam o grupo."
                confirmLabel="Excluir item"
                isPending={isDeleting}
                onConfirm={confirmDelete}
                onClose={closeSheet}
            />
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Adicionais</h1>
                <Button onClick={() => setSheet({ kind: 'group', group: null })}>+ Novo grupo</Button>
            </div>

            <div className={styles.toolbar}>
                <input
                    className={styles.search}
                    type="search"
                    placeholder="Buscar grupo ou item"
                    aria-label="Buscar grupo ou item"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                {visibleGroups.length > 0 ? (
                    <nav className={styles.tabs} aria-label="Grupos">
                        {visibleGroups.map((group) => (
                            <button key={group.id} type="button" className={styles.tab} onClick={() => jumpToGroup(group.id)}>
                                {group.title} ({describeItemCount(group.options.length)})
                            </button>
                        ))}
                    </nav>
                ) : null}
            </div>

            {addons.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{addons.errorMessage}</p>
                    <Button variant="ghost" onClick={addons.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}
            {addons.isLoading ? <p className={styles.muted}>Carregando adicionais</p> : null}
            {hasNoGroups ? (
                <StatusMessage illustration="painel-sem-pedidos" title="Nenhum grupo de adicionais ainda">
                    <p>Crie um grupo, como Molhos ou Bebidas, e coloque os itens nele.</p>
                </StatusMessage>
            ) : null}

            <div className={styles.groups}>
                {visibleGroups.map((group) => {
                    const position = addons.groups.findIndex((candidate) => candidate.id === group.id)
                    return (
                        <GroupBlock
                            key={group.id}
                            group={group}
                            isFirst={position === 0}
                            isLast={position === addons.groups.length - 1}
                            onToggle={addons.toggleGroup}
                            onEdit={(target) => setSheet({ kind: 'group', group: target })}
                            onMove={(target, direction) => addons.moveGroup(target.id, direction)}
                            onDelete={(target) => setSheet({ kind: 'delete-group', group: target })}
                            onNewOption={(target) => setSheet({ kind: 'option', option: null, groupId: target.id })}
                            onChangeOptionPrice={addons.changeOptionPrice}
                            onToggleOption={addons.toggleOption}
                            onEditOption={(option) => setSheet({ kind: 'option', option, groupId: option.groupId })}
                            onMoveOption={(option, direction) =>
                                addons.moveOption(option.groupId, option.id, direction)
                            }
                            onDeleteOption={(option) => setSheet({ kind: 'delete-option', option })}
                        />
                    )
                })}
            </div>

            {renderSheet()}
        </div>
    )
}
