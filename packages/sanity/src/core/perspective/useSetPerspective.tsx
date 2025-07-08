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
      router.navigate({
        stickyParams: {
          excludedPerspectives: null,
          perspective: releaseId === defaultPerspective ? '' : releaseId,
        },
      })
    },
    [defaultPerspective, router],
  )
  return setPerspective
}
