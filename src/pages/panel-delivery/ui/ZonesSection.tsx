import { useState } from 'react'

import { formatCents } from '@/shared/lib'
import { ActionMenu, ActiveSwitch, Button, ConfirmSheet } from '@/shared/ui'

import type { useZones } from '../model/use-zones'
import type { DeliveryZone } from '../model/zones'
import styles from './delivery.module.css'
import { ZoneSheet } from './ZoneSheet'

type SheetState = { kind: 'edit'; zone: DeliveryZone | null } | { kind: 'delete'; zone: DeliveryZone }

type ZonesSectionProps = {
    zonesState: ReturnType<typeof useZones>
}

export function ZonesSection({ zonesState }: ZonesSectionProps) {
    const { zones } = zonesState
    const [sheet, setSheet] = useState<SheetState | null>(null)
    const [isDeleting, setDeleting] = useState(false)

    function closeSheet() {
        setSheet(null)
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
                                onChange={(checked) => zonesState.toggleZone(zone.id, checked)}
                            />
                            <ActionMenu
                                label={`Ações de ${zone.neighborhood}`}
                                actions={[
                                    { label: 'Editar', onSelect: () => setSheet({ kind: 'edit', zone }) },
                                    {
                                        label: 'Excluir',
                                        onSelect: () => setSheet({ kind: 'delete', zone }),
                                        isDanger: true,
                                    },
                                ]}
                            />
                        </div>
                    </li>
                ))}
            </ul>

            {renderSheet()}
        </section>
    )
}
