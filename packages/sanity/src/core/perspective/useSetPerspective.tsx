import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {type SystemBundle} from '../util/draftUtils'
import {type ReleaseId} from './types'
import {useGetDefaultPerspective} from './useGetDefaultPerspective'

export function getPerspectiveParam(
  perspective: SystemBundle | ReleaseId | undefined,
  defaultPerspective: SystemBundle,
) {
  if (!perspective) return ''
  if (perspective === defaultPerspective) return ''
  return perspective
}

/**
 * @internal
 */
export function useSetPerspective() {
  const router = useRouter()

  const defaultPerspective = useGetDefaultPerspective()

  const setPerspective = useCallback(
    (releaseId: SystemBundle | ReleaseId | undefined) => {
      const newPerspective = getPerspectiveParam(releaseId, defaultPerspective)
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
