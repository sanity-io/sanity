import {useContext, useMemo} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'

import {isCardinalityOneRelease} from '../util/releaseUtils'
import {type PerspectiveContextValue} from './types'

/**
 * @beta
 *
 * React hook that returns the current studio perspective and perspective stack.
 *
 * For cardinality one releases, this hook maps them to "drafts" for global UI consistency.
 * Use `useRawPerspective()` if you need the unmodified perspective values.
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
  if (!context) {
    throw new Error('usePerspective must be used within a PerspectiveProvider')
  }

  // CARDINALITY ONE MAPPING FOR GLOBAL UI:
  // Transform cardinality one releases to appear as "drafts" in global UI components
  // (navbar, perspective menu, etc.) while preserving the actual release data for
  // document-level logic that needs to access the original release information.
  return useMemo(() => {
    const {selectedPerspective} = context

    // Check if this is a cardinality one release
    const isCardinalityOne =
      selectedPerspective !== 'drafts' &&
      selectedPerspective !== 'published' &&
      typeof selectedPerspective === 'object' &&
      isCardinalityOneRelease(selectedPerspective)

    if (isCardinalityOne) {
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

    return context
  }, [context])
}

/**
 * @internal
 *
 * React hook that returns the raw perspective values without cardinality one mapping.
 * This is used by document-level logic that needs the original perspective values.
 */
export function useRawPerspective(): PerspectiveContextValue {
  const context = useContext(PerspectiveContext)
  if (!context) {
    throw new Error('useRawPerspective must be used within a PerspectiveProvider')
  }
  return context
}
