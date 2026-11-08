import { useCallback, useEffect, useRef, useState } from 'react'

export const FEATURED_SECTION_ID = 'destaques'

const SECTION_ID_PREFIX = 'categoria-'
const OBSERVED_VIEWPORT_BOTTOM_MARGIN = '-60%'
const SCROLL_LOCK_FALLBACK_MS = 1000

export function toSectionElementId(sectionId: string): string {
    const elementId = `${SECTION_ID_PREFIX}${sectionId}`
    return elementId
}

export function getScrollBehavior(): ScrollBehavior {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = prefersReducedMotion ? 'auto' : 'smooth'
    return behavior
}

function readBarHeight(): number {
    const rawHeight = getComputedStyle(document.documentElement).getPropertyValue('--category-bar-height')
    const height = Number.parseFloat(rawHeight) || 0
    return height
}

type ActiveSection = {
    activeId: string
    selectSection: (sectionId: string) => void
}

/**
 * Acompanha qual seção ocupa o topo da tela logo abaixo da barra fixa.
 * Ao selecionar uma seção, ela fica ativa na hora e o observador é ignorado
 * até a rolagem suave terminar, para o destaque não oscilar pelo caminho.
 */
export function useActiveSection(sectionIds: readonly string[]): ActiveSection {
    const [trackedId, setTrackedId] = useState('')
    const isScrollLocked = useRef(false)
    const lockTimer = useRef(0)
    const sectionKey = sectionIds.join('|')

    useEffect(() => {
        const unlock = () => {
            isScrollLocked.current = false
        }

        window.addEventListener('scrollend', unlock)

        return () => {
            window.removeEventListener('scrollend', unlock)
            window.clearTimeout(lockTimer.current)
        }
    }, [])

    useEffect(() => {
        const ids = sectionKey === '' ? [] : sectionKey.split('|')
        const idByElement = new Map<Element, string>()
        const visibleIds = new Set<string>()

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const sectionId = idByElement.get(entry.target)

                    if (!sectionId) {
                        continue
                    }

                    if (entry.isIntersecting) {
                        visibleIds.add(sectionId)
                    } else {
                        visibleIds.delete(sectionId)
                    }
                }

                const topmostId = ids.find((sectionId) => visibleIds.has(sectionId))

                if (topmostId && !isScrollLocked.current) {
                    setTrackedId(topmostId)
                }
            },
            { rootMargin: `-${readBarHeight()}px 0px ${OBSERVED_VIEWPORT_BOTTOM_MARGIN} 0px` },
        )

        for (const sectionId of ids) {
            const element = document.getElementById(toSectionElementId(sectionId))

            if (element) {
                idByElement.set(element, sectionId)
                observer.observe(element)
            }
        }

        return () => observer.disconnect()
    }, [sectionKey])

    const selectSection = useCallback((sectionId: string) => {
        const element = document.getElementById(toSectionElementId(sectionId))

        if (!element) {
            return
        }

        setTrackedId(sectionId)
        isScrollLocked.current = true
        window.clearTimeout(lockTimer.current)
        lockTimer.current = window.setTimeout(() => {
            isScrollLocked.current = false
        }, SCROLL_LOCK_FALLBACK_MS)
        element.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' })
    }, [])

    const isTracked = sectionIds.includes(trackedId)
    const activeId = isTracked ? trackedId : (sectionIds[0] ?? '')

    return { activeId, selectSection }
}
