import { useCallback, useEffect, useMemo, useState } from 'react'

import { deleteHourRows, fetchHourRows, insertHourRows } from '../api/hours'
import {
    applyPeriodWrite,
    groupIntoPeriods,
    planPeriodWrite,
    type HourRow,
    type Period,
    type PeriodDraft,
} from './hours'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar os horários. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export function useHours(storeId: string) {
    const [rows, setRows] = useState<HourRow[]>([])
    const [isLoading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const periods = useMemo(() => groupIntoPeriods(rows), [rows])

    const reload = useCallback(async () => {
        setRows(await fetchHourRows(storeId))
    }, [storeId])

    useEffect(() => {
        let isCurrent = true
        setLoading(true)

        fetchHourRows(storeId)
            .then((loaded) => {
                if (isCurrent) {
                    setRows(loaded)
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar horários', error)
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

    async function runWrite(write: () => Promise<void>): Promise<boolean> {
        try {
            await write()
            setErrorMessage(null)
            return true
        } catch (error) {
            console.error('Falha ao gravar horários', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return false
        } finally {
            await reload().catch((reloadError: unknown) => {
                console.error('Falha ao recarregar horários', reloadError)
            })
        }
    }

    async function savePeriod(editing: Period | null, draft: PeriodDraft): Promise<boolean> {
        const existing = editing ? rows.filter((row) => editing.rowIds.includes(row.id)) : []
        const plan = planPeriodWrite(existing, draft)

        const saved = await runWrite(() =>
            applyPeriodWrite(plan, {
                insertRows: (newRows) => insertHourRows(storeId, newRows),
                deleteRows: deleteHourRows,
            }),
        )
        return saved
    }

    async function removePeriod(period: Period): Promise<boolean> {
        const removed = await runWrite(() => deleteHourRows(period.rowIds))
        return removed
    }

    return {
        periods,
        isLoading,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        savePeriod,
        removePeriod,
    }
}
