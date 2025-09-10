import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {LATEST, PUBLISHED} from '../releases/util/const'
import {useWorkspace} from '../studio/workspace'
import {type ReleaseId} from './types'

/**
 * @internal
 */
export function useSetPerspective() {
  const router = useRouter()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const defaultPerspective = isDraftModelEnabled ? LATEST : PUBLISHED

  const setPerspective = useCallback(
    (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => {
      // All releases (including cardinality one) now use URL parameters
      // Use null to remove the parameter, or the releaseId to set it
      const newPerspective =
        releaseId === undefined || releaseId === 'drafts' || releaseId === defaultPerspective
          ? null // Remove the perspective parameter
          : releaseId // Set to the specific release ID

      router.navigate({
        stickyParams: {
          excludedPerspectives: null,
          perspective: newPerspective,
        },
      })
    },
    [defaultPerspective, router],
  )
  return setPerspective
}
