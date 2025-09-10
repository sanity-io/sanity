import {useContext, useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isCardinalityOneRelease} from '../util/releaseUtils'
import {type PerspectiveContextValue} from './types'

/**
 * @beta
 *
 * React hook that returns the current studio perspective and perspective stack.
 *
 * For cardinality one releases, this hook maps them to "drafts" for global UI consistency
 * while they are still tracked in URL parameters for deep-linking support.
 * Use `useTruePerspective()` if you need the unmodified perspective values.
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

  // CARDINALITY ONE MAPPING FOR GLOBAL UI:
  // Transform cardinality one releases to appear as "drafts" in global UI components
  // (navbar, perspective menu, etc.) while preserving the actual release data for
  // document-level logic that needs to access the original release information.
  return useMemo(() => {
    const {selectedPerspective, selectedPerspectiveName} = context

    // Check if this is a cardinality one release by looking up the release from the perspective name
    if (selectedPerspectiveName && selectedPerspectiveName !== 'published') {
      const release = releases.find(
        (r) => getReleaseIdFromReleaseDocumentId(r._id) === selectedPerspectiveName,
      )

      if (release && isCardinalityOneRelease(release)) {
        // Map cardinality one releases to drafts for global UI
        // IMPORTANT: Keep the original perspectiveStack for cardinality one releases
        // The perspectiveStack is used for API queries and should contain the actual cardinality one release ID
        return {
          ...context,
          selectedPerspective: 'drafts',
          selectedPerspectiveName: undefined, // drafts
          selectedReleaseId: undefined, // drafts
          // perspectiveStack remains unchanged - it contains the cardinality one release for API queries
        }
      }
    }

    return context
  }, [context, releases])
}

/**
 * @internal
 *
 * True perspective is unmapped. In most cases it IS the actual perspective.
 * But in cases where the perspective represents a cardinality one release, it is mapped to "drafts" for global UI consistency.
 */
export function useTruePerspective(): PerspectiveContextValue {
  const context = useContext(PerspectiveContext)
  if (!context) {
    throw new Error('useTruePerspective must be used within a PerspectiveProvider')
  }
  return context
}
