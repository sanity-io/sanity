import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {type ReleaseId} from './types'
import {useGetDefaultPerspective} from './useGetDefaultPerspective'

/**
 * @internal
 */
export function useSetPerspective() {
  const router = useRouter()

  const defaultPerspective = useGetDefaultPerspective()

  const setPerspective = useCallback(
    (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => {
      // Remove perspective parameter for default states, otherwise use the specific release ID
      const newPerspective = !releaseId || releaseId === defaultPerspective ? '' : releaseId

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
