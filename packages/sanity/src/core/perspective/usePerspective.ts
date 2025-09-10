import {type ReleaseDocument} from '@sanity/client'
import {useContext, useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isCardinalityOneRelease} from '../util/releaseUtils'
import {type PerspectiveContextValue} from './types'

/**
 * Find cardinality one release by perspective name
 */
function findCardinalityOneRelease(
  perspectiveName: string | undefined,
  releases: ReleaseDocument[],
) {
  if (!perspectiveName || perspectiveName === 'published') return null

  const release = releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === perspectiveName)

  return release && isCardinalityOneRelease(release) ? release : null
}

/**
 * @beta
 *
 * React hook that returns the current studio perspective and perspective stack.
 *
 * Maps cardinality one releases to "drafts" for global UI consistency while preserving
 * URL parameters for deep-linking. Use `useTruePerspective()` for unmodified values.
 *
 * @returns See {@link PerspectiveContextValue}
 * @example Reading the current perspective stack
 * ```ts
 * function MyComponent() {
 *  const {perspectiveStack} = usePerspective()
 *  // ... do something with the perspective stack , like passing it to the client perspective.
 * }
 * ```
 */
export function usePerspective(): PerspectiveContextValue {
  const context = useContext(PerspectiveContext)
  const {data: releases} = useActiveReleases()

  if (!context) {
    throw new Error('usePerspective must be used within a PerspectiveProvider')
  }

  return useMemo(() => {
    const {selectedPerspectiveName} = context

    const cardinalityOneRelease = findCardinalityOneRelease(selectedPerspectiveName, releases)

    if (cardinalityOneRelease) {
      return {
        ...context,
        selectedPerspective: 'drafts',
        selectedPerspectiveName: undefined, // drafts
        selectedReleaseId: undefined, // drafts
      }
    }

    return context
  }, [context, releases])
}

/**
 * @internal
 *
 * Returns unmapped perspective values. Cardinality one releases appear as their actual
 * release ID rather than being mapped to "drafts".
 */
export function useTruePerspective(): PerspectiveContextValue {
  const context = useContext(PerspectiveContext)
  if (!context) {
    throw new Error('useTruePerspective must be used within a PerspectiveProvider')
  }
  return context
}
