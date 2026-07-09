import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {type SystemBundle} from '../util/draftUtils'
import {getVariantId} from '../variants/tool/util'
import {type SystemVariant} from '../variants/types'
import {type ReleaseId} from './types'
import {useGetDefaultPerspective} from './useGetDefaultPerspective'
import {getPerspectiveParam} from './useSetPerspective'

/**
 * React hook to set the variant in the router.
 * Optionally sets the perspective in the same navigation, so both sticky params
 * are updated atomically (a single history entry, no intermediate render).
 * Do not use in production, this can change in any release.
 * @internal
 * @beta
 */
export function useSetVariant() {
  const router = useRouter()
  const defaultPerspective = useGetDefaultPerspective()
  const setVariant = useCallback(
    (variant: SystemVariant | undefined, options?: {perspective?: SystemBundle | ReleaseId}) => {
      const {perspective} = options ?? {}

      router.navigate({
        stickyParams: {
          variant: variant ? getVariantId(variant._id) : null,
          ...(perspective
            ? {perspective: getPerspectiveParam(perspective, defaultPerspective)}
            : {}),
        },
      })
    },
    [router, defaultPerspective],
  )
  return setVariant
}
