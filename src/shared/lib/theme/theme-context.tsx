import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { findFirstAvailableUrl } from './asset-probe'

const THEMES_ROOT = '/temas'
const DEFAULT_FOLDERS = ['base'] as const
const DEFAULT_EXTENSIONS = ['png', 'svg'] as const

const ThemeFoldersContext = createContext<readonly string[]>(DEFAULT_FOLDERS)

type ThemeProviderProps = {
    // Pastas em ordem de prioridade: a da loja primeiro, a base por último.
    folders: readonly string[]
    children: ReactNode
}

export function ThemeProvider({ folders, children }: ThemeProviderProps) {
    return <ThemeFoldersContext.Provider value={folders}>{children}</ThemeFoldersContext.Provider>
}

function buildCandidates(folders: readonly string[], fileStem: string, extensions: readonly string[]): string[] {
    const candidates = folders.flatMap((folder) =>
        extensions.map((extension) => `${THEMES_ROOT}/${folder}/${fileStem}.${extension}`),
    )
    return candidates
}

// undefined enquanto procura, null quando nenhuma pasta tem o arquivo.
export function useThemeAsset(
    fileStem: string,
    extensions: readonly string[] = DEFAULT_EXTENSIONS,
): string | null | undefined {
    const folders = useContext(ThemeFoldersContext)
    const [assetUrl, setAssetUrl] = useState<string | null | undefined>(undefined)
    const candidatesKey = buildCandidates(folders, fileStem, extensions).join('|')

    useEffect(() => {
        let isCurrent = true
        const candidates = candidatesKey.split('|')

        findFirstAvailableUrl(candidates).then((found) => {
            if (isCurrent) {
                setAssetUrl(found)
            }
        })

        return () => {
            isCurrent = false
        }
    }, [candidatesKey])

    return assetUrl
}
