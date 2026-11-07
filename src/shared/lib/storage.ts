// O armazenamento do navegador pode faltar (aba anônima, dados bloqueados);
// nesses casos o app segue funcionando, só sem lembrar o estado.

export function readStoredJson<Value>(key: string, fallback: Value): Value {
    try {
        const raw = window.localStorage.getItem(key)
        const value = raw === null ? fallback : (JSON.parse(raw) as Value)
        return value
    } catch (error) {
        console.warn('Armazenamento local indisponível para leitura', error)
        return fallback
    }
}

export function writeStoredJson(key: string, value: unknown): void {
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        console.warn('Armazenamento local indisponível para escrita', error)
    }
}
