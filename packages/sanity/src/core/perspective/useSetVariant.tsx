import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {type SystemBundle} from '../util/draftUtils'
import {type SystemVariant} from '../variants/types'
import {serializeVariantStickyParam} from '../variants/util/variantSelection'
import {DEFAULT_VARIANT_TYPE_KEY} from '../variants/util/variantType'
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
          variant: variantId
            ? // Currently supports only 1 variant selection. Follow up changes will support multiple selections.
              serializeVariantStickyParam([{type: DEFAULT_VARIANT_TYPE_KEY, name: variantId}])
            : null,
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
