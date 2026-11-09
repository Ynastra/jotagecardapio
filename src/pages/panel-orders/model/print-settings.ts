import { readStoredJson, writeStoredJson } from '@/shared/lib'

export type ReceiptCopies = 1 | 2

export type PrintSettings = {
    autoPrint: boolean
    copies: ReceiptCopies
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = { autoPrint: false, copies: 2 }

export const PRINTED_IDS_LIMIT = 200

function getSettingsKey(storeId: string): string {
    const key = `jgcardapio:painel-pedidos:impressao:${storeId}`
    return key
}

function getPrintedIdsKey(storeId: string): string {
    const key = `jgcardapio:painel-pedidos:impressos:${storeId}`
    return key
}

function normalizeCopies(value: unknown): ReceiptCopies {
    const copies = value === 1 ? 1 : DEFAULT_PRINT_SETTINGS.copies
    return copies
}

export function readPrintSettings(storeId: string): PrintSettings {
    const stored = readStoredJson<Partial<PrintSettings> | null>(getSettingsKey(storeId), null)
    const autoPrint = stored?.autoPrint === true
    const copies = normalizeCopies(stored?.copies)
    return { autoPrint, copies }
}

export function writePrintSettings(storeId: string, settings: PrintSettings): void {
    writeStoredJson(getSettingsKey(storeId), settings)
}

export function readPrintedIds(storeId: string): string[] {
    const stored = readStoredJson<unknown>(getPrintedIdsKey(storeId), [])
    const ids = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
    return ids
}

export function writePrintedIds(storeId: string, ids: readonly string[]): void {
    writeStoredJson(getPrintedIdsKey(storeId), ids)
}

// Mantém só os ids mais recentes: o registro vive no armazenamento do navegador.
export function rememberPrintedId(ids: readonly string[], orderId: string): string[] {
    if (ids.includes(orderId)) {
        return [...ids]
    }

    const remembered = [...ids, orderId].slice(-PRINTED_IDS_LIMIT)
    return remembered
}

export function shouldPrintOrder(settings: PrintSettings, printedIds: readonly string[], orderId: string): boolean {
    const shouldPrint = settings.autoPrint && !printedIds.includes(orderId)
    return shouldPrint
}
