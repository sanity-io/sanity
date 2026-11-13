import {useCallback} from 'react'
import {type RouterState, useRouter} from 'sanity/router'

import {type SystemBundle} from '../util/draftUtils'
import {type SystemVariant} from '../variants/types'
import {
  parseVariantStickyParam,
  serializeVariantStickyParam,
  updateVariantSelection,
} from '../variants/util/variantSelection'
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
        /** Variant type to update. Defaults to `variant`, preserving other types. */
        type?: string
        perspective?: SystemBundle | ReleaseId
        /** Router state to navigate to in the same navigation, eg to open a document pane. */
        state?: RouterState
      }
    | {
        variantId?: SystemVariant['_id']
        type?: string
        perspective: SystemBundle | ReleaseId
        state?: RouterState
      },
) => void

/**
 * React hook to set the variant in the router.
 * Optionally sets the perspective, and the router state (the panes), in the same navigation, so
 * they are updated atomically (a single history entry, no intermediate render).
 * Do not use in production, this can change in any release.
 * @internal
 * @beta
 */
export function useSetVariant(): SetVariant {
  const router = useRouter()
  const defaultPerspective = useGetDefaultPerspective()

  return useCallback<SetVariant>(
    ({variantId, type = DEFAULT_VARIANT_TYPE_KEY, perspective, state}) => {
      const current = parseVariantStickyParam(
        typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined,
      )

      router.navigate({
        ...(state ? {state} : {}),
        stickyParams: {
          variant: serializeVariantStickyParam(updateVariantSelection(current, type, variantId)),
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
