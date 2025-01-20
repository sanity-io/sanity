import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

export interface ExcludedPerspectiveValue {
  /* Add/remove excluded perspectives */
  toggleExcludedPerspective: (perspectiveId: string) => void
  /* Check if a perspective is excluded */
  isPerspectiveExcluded: (perspectiveId: string) => boolean
}

const EMPTY_ARRAY: string[] = []

/**
 * Gets the excluded perspectives.
 
 * @internal
 */
export function useExcludedPerspective(): ExcludedPerspectiveValue {
  const {
    navigateStickyParams,
    stickyParams: {excludedPerspectives: routerExcludedPerspectives},
  } = useRouter()

  const excludedPerspectives = useMemo(
    () => routerExcludedPerspectives?.split(',') || EMPTY_ARRAY,
    [routerExcludedPerspectives],
  )

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
    () => ({toggleExcludedPerspective, isPerspectiveExcluded}),
    [toggleExcludedPerspective, isPerspectiveExcluded],
  )
}
