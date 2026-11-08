const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR
const TIME_TEXT_LENGTH = 5

export const WEEKDAY_SHORT_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const

const WEEKDAY_PHRASES = ['no domingo', 'na segunda', 'na terça', 'na quarta', 'na quinta', 'na sexta', 'no sábado']

const DAYS_PER_WEEK = WEEKDAYS.length
const BRASILIA_TIMEZONE = 'America/Sao_Paulo'

export type HourRow = {
    id: string
    weekday: number
    opensAt: string
    closesAt: string
}

export type NewHourRow = Omit<HourRow, 'id'>

export type Period = {
    key: string
    opensAt: string
    closesAt: string
    weekdays: number[]
    rowIds: string[]
}

export type PeriodDraft = {
    weekdays: number[]
    opensAt: string
    closesAt: string
}

export type PeriodErrors = Partial<Record<'weekdays' | 'time', string>>

export type PeriodWritePlan = {
    inserts: NewHourRow[]
    deleteIds: string[]
}

export type HourWriter = {
    insertRows: (rows: NewHourRow[]) => Promise<void>
    deleteRows: (ids: string[]) => Promise<void>
}

type DaySegment = {
    weekday: number
    start: number
    end: number
}

export function normalizeTime(time: string): string {
    const normalized = time.slice(0, TIME_TEXT_LENGTH)
    return normalized
}

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    const total = hours * MINUTES_PER_HOUR + minutes
    return total
}

function buildPeriodKey(opensAt: string, closesAt: string): string {
    const key = `${opensAt}-${closesAt}`
    return key
}

// Linhas com o mesmo início e fim viram um período só, com os dias juntos.
export function groupIntoPeriods(rows: readonly HourRow[]): Period[] {
    const byKey = new Map<string, Period>()

    for (const row of rows) {
        const opensAt = normalizeTime(row.opensAt)
        const closesAt = normalizeTime(row.closesAt)
        const key = buildPeriodKey(opensAt, closesAt)
        const period = byKey.get(key) ?? { key, opensAt, closesAt, weekdays: [], rowIds: [] }

        period.weekdays.push(row.weekday)
        period.rowIds.push(row.id)
        byKey.set(key, period)
    }

    const periods = [...byKey.values()]
        .map((period) => ({ ...period, weekdays: [...period.weekdays].sort((first, second) => first - second) }))
        .sort((first, second) => toMinutes(first.opensAt) - toMinutes(second.opensAt) || toMinutes(first.closesAt) - toMinutes(second.closesAt))
    return periods
}

export function isOvernight(opensAt: string, closesAt: string): boolean {
    const overnight = toMinutes(closesAt) < toMinutes(opensAt)
    return overnight
}

export function describePeriodTime(period: Pick<Period, 'opensAt' | 'closesAt'>): string {
    const suffix = isOvernight(period.opensAt, period.closesAt) ? ' do dia seguinte' : ''
    const text = `${period.opensAt} até ${period.closesAt}${suffix}`
    return text
}

export function describeTimezone(timezone: string): string {
    const label = timezone === BRASILIA_TIMEZONE ? 'Horário de Brasília' : timezone
    return label
}

// Um expediente que passa da meia-noite ocupa o fim do dia de abertura e o
// começo do dia seguinte.
function toDaySegments(weekday: number, opensAt: string, closesAt: string): DaySegment[] {
    const start = toMinutes(opensAt)
    const end = toMinutes(closesAt)

    if (start < end) {
        return [{ weekday, start, end }]
    }

    const nextWeekday = (weekday + 1) % DAYS_PER_WEEK
    const lateSegment = { weekday, start, end: MINUTES_PER_DAY }
    const earlySegments = end > 0 ? [{ weekday: nextWeekday, start: 0, end }] : []
    return [lateSegment, ...earlySegments]
}

function findOverlapWeekday(draft: PeriodDraft, others: readonly Period[]): number | null {
    const draftSegments = draft.weekdays.flatMap((weekday) => toDaySegments(weekday, draft.opensAt, draft.closesAt))
    const otherSegments = others.flatMap((period) =>
        period.weekdays.flatMap((weekday) => toDaySegments(weekday, period.opensAt, period.closesAt)),
    )

    for (const segment of draftSegments) {
        const clashes = otherSegments.some(
            (other) => other.weekday === segment.weekday && segment.start < other.end && other.start < segment.end,
        )
        if (clashes) {
            return segment.weekday
        }
    }
    return null
}

// `others` são os demais períodos da loja, sem o que está sendo editado.
export function validatePeriodDraft(draft: PeriodDraft, others: readonly Period[]): PeriodErrors {
    const errors: PeriodErrors = {}

    if (draft.weekdays.length === 0) {
        errors.weekdays = 'Escolha pelo menos um dia.'
    }

    if (draft.opensAt === '' || draft.closesAt === '') {
        errors.time = 'Informe o início e o fim.'
        return errors
    }

    if (draft.opensAt === draft.closesAt) {
        errors.time = 'O início precisa ser diferente do fim.'
        return errors
    }

    const overlapWeekday = errors.weekdays ? null : findOverlapWeekday(draft, others)
    if (overlapWeekday !== null) {
        errors.time = `Sobrepõe outro horário ${WEEKDAY_PHRASES[overlapWeekday]}.`
    }
    return errors
}

// Mantém as linhas que continuam valendo, insere o que falta e só lista para
// remoção o que saiu.
export function planPeriodWrite(existing: readonly HourRow[], draft: PeriodDraft): PeriodWritePlan {
    const keptIds = new Set<string>()
    const keptWeekdays = new Set<number>()

    for (const row of existing) {
        const isSameTime = normalizeTime(row.opensAt) === draft.opensAt && normalizeTime(row.closesAt) === draft.closesAt
        if (isSameTime && draft.weekdays.includes(row.weekday) && !keptWeekdays.has(row.weekday)) {
            keptIds.add(row.id)
            keptWeekdays.add(row.weekday)
        }
    }

    const inserts = draft.weekdays
        .filter((weekday) => !keptWeekdays.has(weekday))
        .map((weekday) => ({ weekday, opensAt: draft.opensAt, closesAt: draft.closesAt }))
    const deleteIds = existing.filter((row) => !keptIds.has(row.id)).map((row) => row.id)

    return { inserts, deleteIds }
}

// Insere antes de remover: uma falha no meio nunca deixa a loja sem horário.
export async function applyPeriodWrite(plan: PeriodWritePlan, writer: HourWriter): Promise<void> {
    if (plan.inserts.length > 0) {
        await writer.insertRows(plan.inserts)
    }

    if (plan.deleteIds.length > 0) {
        await writer.deleteRows(plan.deleteIds)
    }
}
