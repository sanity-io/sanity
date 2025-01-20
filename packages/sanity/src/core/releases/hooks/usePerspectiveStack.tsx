import {useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {useActiveReleases} from '../store/useActiveReleases'
import {useSelectedPerspectiveProps} from './useSelectedPerspectiveProps'
import {getReleasesPerspectiveStack} from './utils'

export interface PerspectiveStackValue {
  /**
   * The stacked array of releases ids ordered chronologically to represent the state of documents at the given point in time.
   */
  perspectiveStack: string[]
}

const EMPTY_ARRAY: string[] = []

/**
 * Perspective stack hook
 
 * @internal
 */
export function usePerspectiveStack(): PerspectiveStackValue {
  const {
    stickyParams: {excludedPerspectives: routerExcludedPerspectives},
  } = useRouter()
  const {data: releases} = useActiveReleases()
  const {selectedPerspectiveName} = useSelectedPerspectiveProps()

  const excludedPerspectives = useMemo(
    () => routerExcludedPerspectives?.split(',') || EMPTY_ARRAY,
    [routerExcludedPerspectives],
  )

  const perspectiveStack = useMemo(
    () =>
      getReleasesPerspectiveStack({
        releases,
        selectedPerspectiveName,
        excludedPerspectives,
      }),
    [releases, selectedPerspectiveName, excludedPerspectives],
  )
  return useMemo(() => ({perspectiveStack}), [perspectiveStack])
}
