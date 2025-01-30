import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {usePerspective} from './usePerspective'

export interface ExcludedPerspectiveValue {
  /* The excluded perspectives */
  excludedPerspectives: string[]
  /* Add/remove excluded perspectives */
  toggleExcludedPerspective: (perspectiveId: string) => void
  /* Check if a perspective is excluded */
  isPerspectiveExcluded: (perspectiveId: string) => boolean
}

/**
 * Gets the excluded perspectives.
 
 * @internal
 */
export function useExcludedPerspective(): ExcludedPerspectiveValue {
  const {navigateStickyParams} = useRouter()
  const {excludedPerspectives} = usePerspective()

  const toggleExcludedPerspective = useCallback(
    (excluded: string) => {
      const existingPerspectives = excludedPerspectives || []

      const nextExcludedPerspectives = existingPerspectives.includes(excluded)
        ? existingPerspectives.filter((id) => id !== excluded)
        : [...existingPerspectives, excluded]

      navigateStickyParams({excludedPerspectives: nextExcludedPerspectives.toString()})
    },
    [excludedPerspectives, navigateStickyParams],
  )

  const isPerspectiveExcluded = useCallback(
    (perspectiveId: string) => Boolean(excludedPerspectives?.includes(perspectiveId)),
    [excludedPerspectives],
  )

  return useMemo(
    () => ({excludedPerspectives, toggleExcludedPerspective, isPerspectiveExcluded}),
    [excludedPerspectives, toggleExcludedPerspective, isPerspectiveExcluded],
  )
}
