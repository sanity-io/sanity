import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {type ReleaseId} from './types'

/**
 * @internal
 */
export function useSetPerspective() {
  const router = useRouter()
  const setPerspective = useCallback(
    (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => {
      router.navigate({
        stickyParams: {
          excludedPerspectives: null,
          perspective: releaseId === 'drafts' ? '' : releaseId,
        },
      })
    },
    [router],
  )
  return setPerspective
}
