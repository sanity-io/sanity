import {type ReleaseId} from '@sanity/client'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

/**
 * @internal
 */
export function useSetPerspective() {
  const router = useRouter()
  const setPerspective = useCallback(
    (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => {
      let perspectiveParam = ''

      if (!releaseId || releaseId === 'drafts') {
        perspectiveParam = ''
      } else if (releaseId === 'published' || releaseId.startsWith('r')) {
        perspectiveParam = releaseId
      } else {
        throw new Error(`Invalid releaseId: ${releaseId}`)
      }

      router.navigateStickyParams({
        excludedPerspectives: '',
        perspective: perspectiveParam,
      })
    },
    [router],
  )
  return setPerspective
}
