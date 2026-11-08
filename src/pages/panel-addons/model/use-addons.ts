import { useCallback, useEffect, useState } from 'react'

import {
    createGroup,
    createOption,
    deleteGroup,
    deleteOption,
    fetchAddonGroups,
    savePositions,
    setGroupActive,
    setOptionActive,
    setOptionPrice,
    updateGroup,
    updateOption,
} from '../api/addons'
import { sortByPosition, type AddonGroup } from './addon-group'
import type { GroupValue, OptionValue } from './addon-form'
import { nextPosition, planMove, type MoveDirection } from './ordering'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar os adicionais. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export type AddonsState = {
    groups: AddonGroup[]
    isLoading: boolean
    errorMessage: string | null
    dismissError: () => void
    addGroup: (value: GroupValue) => Promise<boolean>
    editGroup: (groupId: string, value: GroupValue) => Promise<boolean>
    toggleGroup: (groupId: string, active: boolean) => Promise<boolean>
    removeGroup: (groupId: string) => Promise<boolean>
    moveGroup: (groupId: string, direction: MoveDirection) => Promise<boolean>
    addOption: (value: OptionValue) => Promise<boolean>
    editOption: (optionId: string, value: OptionValue) => Promise<boolean>
    changeOptionPrice: (optionId: string, priceCents: number) => Promise<boolean>
    toggleOption: (optionId: string, active: boolean) => Promise<boolean>
    removeOption: (optionId: string) => Promise<boolean>
    moveOption: (groupId: string, optionId: string, direction: MoveDirection) => Promise<boolean>
}

function sortGroups(groups: readonly AddonGroup[]): AddonGroup[] {
    const sorted = sortByPosition(groups).map((group) => ({ ...group, options: sortByPosition(group.options) }))
    return sorted
}

export function useAddons(storeId: string): AddonsState {
    const [groups, setGroups] = useState<AddonGroup[]>([])
    const [isLoading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const reload = useCallback(async () => {
        const loaded = await fetchAddonGroups(storeId)
        setGroups(sortGroups(loaded))
    }, [storeId])

    useEffect(() => {
        let isCurrent = true
        setLoading(true)

        fetchAddonGroups(storeId)
            .then((loaded) => {
                if (isCurrent) {
                    setGroups(sortGroups(loaded))
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar adicionais', error)
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
    }, [storeId])

    async function perform(action: () => Promise<void>): Promise<boolean> {
        try {
            await action()
            await reload()
            setErrorMessage(null)
            return true
        } catch (error) {
            console.error('Falha ao salvar adicionais', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return false
        }
    }

    const addGroup = (value: GroupValue) => perform(() => createGroup(storeId, value, nextPosition(groups)))
    const editGroup = (groupId: string, value: GroupValue) => perform(() => updateGroup(groupId, value))
    const toggleGroup = (groupId: string, active: boolean) => perform(() => setGroupActive(groupId, active))
    const removeGroup = (groupId: string) => perform(() => deleteGroup(groupId))
    const moveGroup = (groupId: string, direction: MoveDirection) =>
        perform(() => savePositions('option_groups', planMove(groups, groupId, direction)))

    function addOption(value: OptionValue) {
        const group = groups.find((candidate) => candidate.id === value.groupId)
        const position = nextPosition(group?.options ?? [])
        return perform(() => createOption(storeId, value, position))
    }

    const editOption = (optionId: string, value: OptionValue) => perform(() => updateOption(optionId, value))
    const changeOptionPrice = (optionId: string, priceCents: number) =>
        perform(() => setOptionPrice(optionId, priceCents))
    const toggleOption = (optionId: string, active: boolean) => perform(() => setOptionActive(optionId, active))
    const removeOption = (optionId: string) => perform(() => deleteOption(optionId))

    function moveOption(groupId: string, optionId: string, direction: MoveDirection) {
        const group = groups.find((candidate) => candidate.id === groupId)
        const changes = planMove(group?.options ?? [], optionId, direction)
        return perform(() => savePositions('options', changes))
    }

    return {
        groups,
        isLoading,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        addGroup,
        editGroup,
        toggleGroup,
        removeGroup,
        moveGroup,
        addOption,
        editOption,
        changeOptionPrice,
        toggleOption,
        removeOption,
        moveOption,
    }
}
