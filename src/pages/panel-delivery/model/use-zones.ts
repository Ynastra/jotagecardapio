import { useCallback, useEffect, useState } from 'react'

import { deleteZone, DuplicateZoneError, fetchZones, insertZone, setZoneActive, updateZone } from '../api/zones'
import type { DeliveryZone, ZoneValue } from './zones'

const LOAD_FAILED_MESSAGE = 'Não deu para carregar os bairros. Confira a internet.'
const SAVE_FAILED_MESSAGE = 'Não deu para salvar. Tente de novo.'

export type ZoneSaveResult = 'saved' | 'duplicate' | 'failed'

export function useZones(storeId: string) {
    const [zones, setZones] = useState<DeliveryZone[]>([])
    const [isLoading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const reload = useCallback(async () => {
        setZones(await fetchZones(storeId))
    }, [storeId])

    useEffect(() => {
        let isCurrent = true
        setLoading(true)

        fetchZones(storeId)
            .then((loaded) => {
                if (isCurrent) {
                    setZones(loaded)
                }
            })
            .catch((error: unknown) => {
                console.error('Falha ao carregar bairros', error)
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

    async function runWrite(write: () => Promise<void>): Promise<ZoneSaveResult> {
        try {
            await write()
            await reload()
            setErrorMessage(null)
            return 'saved'
        } catch (error) {
            if (error instanceof DuplicateZoneError) {
                return 'duplicate'
            }

            console.error('Falha ao gravar bairro', error)
            setErrorMessage(SAVE_FAILED_MESSAGE)
            return 'failed'
        }
    }

    function addZone(value: ZoneValue): Promise<ZoneSaveResult> {
        return runWrite(() => insertZone(storeId, value))
    }

    function editZone(zoneId: string, value: ZoneValue): Promise<ZoneSaveResult> {
        return runWrite(() => updateZone(zoneId, value))
    }

    async function toggleZone(zoneId: string, active: boolean): Promise<boolean> {
        const result = await runWrite(() => setZoneActive(zoneId, active))
        return result === 'saved'
    }

    async function removeZone(zoneId: string): Promise<boolean> {
        const result = await runWrite(() => deleteZone(zoneId))
        return result === 'saved'
    }

    return {
        zones,
        isLoading,
        errorMessage,
        dismissError: () => setErrorMessage(null),
        addZone,
        editZone,
        toggleZone,
        removeZone,
    }
}
