import { useState } from 'react'

import { formatCents } from '@/shared/lib'
import { ActionMenu, ActiveSwitch, Button, ConfirmSheet } from '@/shared/ui'

import type { useZones } from '../model/use-zones'
import { isLastActiveZone, LAST_ACTIVE_ZONE_MESSAGE, type DeliveryZone } from '../model/zones'
import styles from './delivery.module.css'
import { ZoneSheet } from './ZoneSheet'

type SheetState = { kind: 'edit'; zone: DeliveryZone | null } | { kind: 'delete'; zone: DeliveryZone }

type ZonesSectionProps = {
    zonesState: ReturnType<typeof useZones>
    isNeighborhoodModeSaved: boolean
}

export function ZonesSection({ zonesState, isNeighborhoodModeSaved }: ZonesSectionProps) {
    const { zones } = zonesState
    const [sheet, setSheet] = useState<SheetState | null>(null)
    const [isDeleting, setDeleting] = useState(false)
    const [blockedZoneId, setBlockedZoneId] = useState<string | null>(null)

    function closeSheet() {
        setSheet(null)
    }

    function isProtectedZone(zone: DeliveryZone): boolean {
        const isProtected = isNeighborhoodModeSaved && zone.active && isLastActiveZone(zones, zone.id)
        return isProtected
    }

    function requestToggle(zone: DeliveryZone, checked: boolean) {
        if (!checked && isProtectedZone(zone)) {
            setBlockedZoneId(zone.id)
            return
        }

        setBlockedZoneId(null)
        void zonesState.toggleZone(zone.id, checked)
    }

    function requestDelete(zone: DeliveryZone) {
        if (isProtectedZone(zone)) {
            setBlockedZoneId(zone.id)
            return
        }

        setBlockedZoneId(null)
        setSheet({ kind: 'delete', zone })
    }

    async function confirmDelete() {
        if (sheet?.kind !== 'delete') {
            return
        }

        setDeleting(true)
        const removed = await zonesState.removeZone(sheet.zone.id)
        setDeleting(false)
        if (removed) {
            closeSheet()
        }
    }

    function renderSheet() {
        if (!sheet) {
            return null
        }

        if (sheet.kind === 'edit') {
            const { zone } = sheet
            const others = zones.filter((candidate) => candidate.id !== zone?.id)
            return (
                <ZoneSheet
                    zone={zone}
                    otherZones={others}
                    onSave={(value) => (zone ? zonesState.editZone(zone.id, value) : zonesState.addZone(value))}
                    onClose={closeSheet}
                />
            )
        }

        return (
            <ConfirmSheet
                title={`Excluir ${sheet.zone.neighborhood}`}
                message="O bairro some da lista de entrega. Pedidos já feitos continuam como estão."
                confirmLabel="Excluir bairro"
                isPending={isDeleting}
                onConfirm={confirmDelete}
                onClose={closeSheet}
            />
        )
    }

    return (
        <section className={styles.section} aria-label="Bairros">
            <div className={styles.header}>
                <h2 className={styles.sectionTitle}>Bairros</h2>
                <Button onClick={() => setSheet({ kind: 'edit', zone: null })}>+ Novo bairro</Button>
            </div>

            {zonesState.errorMessage ? (
                <div className={styles.error} role="alert">
                    <p>{zonesState.errorMessage}</p>
                    <Button variant="ghost" onClick={zonesState.dismissError}>
                        Fechar
                    </Button>
                </div>
            ) : null}
            {zonesState.isLoading ? <p className={styles.muted}>Carregando bairros</p> : null}
            {!zonesState.isLoading && zones.length === 0 ? (
                <p className={styles.notice}>Nenhum bairro cadastrado. Crie os bairros que a loja atende.</p>
            ) : null}

            <ul className={styles.zones}>
                {zones.map((zone) => (
                    <li key={zone.id} className={zone.active ? styles.zone : `${styles.zone} ${styles.zoneInactive}`}>
                        <span className={styles.zoneName}>{zone.neighborhood}</span>
                        <div className={styles.zoneControls}>
                            <span className={styles.zoneFee}>{formatCents(zone.feeCents)}</span>
                            <ActiveSwitch
                                label={`${zone.neighborhood} ativo`}
                                checked={zone.active}
                                onChange={(checked) => requestToggle(zone, checked)}
                            />
                            <ActionMenu
                                label={`Ações de ${zone.neighborhood}`}
                                actions={[
                                    { label: 'Editar', onSelect: () => setSheet({ kind: 'edit', zone }) },
                                    {
                                        label: 'Excluir',
                                        onSelect: () => requestDelete(zone),
                                        isDanger: true,
                                    },
                                ]}
                            />
                        </div>
                        {blockedZoneId === zone.id ? (
                            <p className={styles.zoneBlocked} role="alert">
                                {LAST_ACTIVE_ZONE_MESSAGE}
                            </p>
                        ) : null}
                    </li>
                ))}
            </ul>

            {renderSheet()}
        </section>
    )
}
