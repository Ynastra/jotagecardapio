import { useEffect, useRef, useState } from 'react'

import type { Store } from '@/entities/store'
import { ThemeProvider, useThemeAsset } from '@/shared/lib'

import type { QueuedPrint } from '../model/use-print-queue'
import { OrderReceipt } from './OrderReceipt'

const STAMP_WAIT_LIMIT_MS = 3000

type PrintStationProps = {
    store: Store
    job: QueuedPrint | null
    onDone: () => void
}

type PrintJobViewProps = {
    job: QueuedPrint
    store: Store
    onDone: () => void
}

// A comanda só entra na página depois que o carimbo da loja resolve (achado ou
// não): imprimir antes disso sairia sem o carimbo.
function PrintJobView({ job, store, onDone }: PrintJobViewProps) {
    const stampUrl = useThemeAsset('logo-comanda', ['png', 'svg'])
    const [isWaitOver, setWaitOver] = useState(false)
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone
    const isReady = stampUrl !== undefined || isWaitOver

    useEffect(() => {
        const timer = window.setTimeout(() => setWaitOver(true), STAMP_WAIT_LIMIT_MS)
        return () => window.clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!isReady) {
            return
        }

        const frame = window.requestAnimationFrame(() => {
            window.print()
            onDoneRef.current()
        })
        return () => window.cancelAnimationFrame(frame)
    }, [isReady])

    if (!isReady) {
        return null
    }

    return <OrderReceipt order={job.order} store={store} copies={job.copies} />
}

export function PrintStation({ store, job, onDone }: PrintStationProps) {
    if (!job) {
        return null
    }

    return (
        <ThemeProvider folders={[store.slug]}>
            <PrintJobView key={job.key} job={job} store={store} onDone={onDone} />
        </ThemeProvider>
    )
}
