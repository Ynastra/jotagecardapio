import { useState } from 'react'

import { ActiveSwitch, Button } from '@/shared/ui'

import {
    readPrintSettings,
    writePrintSettings,
    type PrintSettings,
    type ReceiptCopies,
} from '../model/print-settings'
import styles from './print-controls.module.css'

type PrintControlsProps = {
    storeId: string
    onTest: (copies: ReceiptCopies) => void
}

export function PrintControls({ storeId, onTest }: PrintControlsProps) {
    const [settings, setSettings] = useState<PrintSettings>(() => readPrintSettings(storeId))

    function updateSettings(next: PrintSettings) {
        writePrintSettings(storeId, next)
        setSettings(next)
    }

    function changeCopies(value: string) {
        const copies: ReceiptCopies = value === '1' ? 1 : 2
        updateSettings({ ...settings, copies })
    }

    return (
        <section className={styles.controls} aria-label="Impressão">
            <h2 className={styles.heading}>Impressão</h2>

            <ActiveSwitch
                label="Imprimir pedidos sozinho"
                checked={settings.autoPrint}
                onChange={(autoPrint) => updateSettings({ ...settings, autoPrint })}
            />

            <label className={styles.field}>
                Vias
                <select
                    className={styles.select}
                    value={settings.copies}
                    onChange={(event) => changeCopies(event.target.value)}
                >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                </select>
            </label>

            <Button variant="secondary" onClick={() => onTest(settings.copies)}>
                Testar
            </Button>

            {settings.autoPrint ? <p className={styles.hint}>Deixe esta aba aberta neste computador.</p> : null}
        </section>
    )
}
