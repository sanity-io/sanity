import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {type SystemBundle} from '../util/draftUtils'
import {getVariantId} from '../variants/tool/util'
import {type SystemVariant} from '../variants/types'
import {type ReleaseId} from './types'
import {useGetDefaultPerspective} from './useGetDefaultPerspective'
import {getPerspectiveParam} from './useSetPerspective'

/**
 * @internal
 */
export type SetVariant = (
  options:
    | {
        variantId: SystemVariant['_id'] | undefined
        perspective?: SystemBundle | ReleaseId
      }
    | {
        variantId?: SystemVariant['_id']
        perspective: SystemBundle | ReleaseId
      },
) => void

/**
 * React hook to set the variant in the router.
 * Optionally sets the perspective in the same navigation, so both sticky params
 * are updated atomically (a single history entry, no intermediate render).
 * Do not use in production, this can change in any release.
 * @internal
 * @beta
 */
export function useSetVariant(): SetVariant {
  const router = useRouter()
  const defaultPerspective = useGetDefaultPerspective()

  return useCallback<SetVariant>(
    ({variantId, perspective}) => {
      router.navigate({
        stickyParams: {
          variant: variantId ? getVariantId(variantId) : null,
          ...(perspective
            ? {
                excludedPerspectives: null,
                perspective: getPerspectiveParam(perspective, defaultPerspective),
              }
            : {}),
        },
      })
    },
    [router, defaultPerspective],
  )
}
