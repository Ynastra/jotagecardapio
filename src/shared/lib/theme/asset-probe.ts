// Cada URL é testada uma vez por sessão: o asset existe ou não existe na pasta
// do tema, e a resposta não muda enquanto a página estiver aberta.
const probeResults = new Map<string, Promise<boolean>>()

function probeImage(url: string): Promise<boolean> {
    const cached = probeResults.get(url)

    if (cached) {
        return cached
    }

    const probe = new Promise<boolean>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(true)
        image.onerror = () => resolve(false)
        image.src = url
    })
    probeResults.set(url, probe)
    return probe
}

export async function findFirstAvailableUrl(candidates: readonly string[]): Promise<string | null> {
    for (const candidate of candidates) {
        const exists = await probeImage(candidate)
        if (exists) {
            return candidate
        }
    }

    const nothingFound = null
    return nothingFound
}
