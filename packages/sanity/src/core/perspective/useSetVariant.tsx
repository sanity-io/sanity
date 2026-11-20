import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

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

type SetVariantOptions =
  | {
      variantId: SystemVariant['_id'] | undefined
      /** Variant type to update. Defaults to `variant`, preserving other types. */
      type?: string
      perspective?: SystemBundle | ReleaseId
    }
  | {
      variantId?: SystemVariant['_id']
      type?: string
      perspective: SystemBundle | ReleaseId
    }

/**
 * @internal
 */
export type SetVariant = (options: SetVariantOptions) => void

/**
 * The sticky params {@link useSetVariant} navigates with: `variant` with the selection of one type
 * replaced, and the perspective params when a perspective is given. `null` removes a param.
 * For a navigation that changes other router state too, so it can update everything at once.
 *
 * @internal
 */
export function getVariantStickyParams(
  {variantId, type = DEFAULT_VARIANT_TYPE_KEY, perspective}: SetVariantOptions,
  currentVariantParam: string | undefined,
  defaultPerspective: SystemBundle,
): Record<string, string | null> {
  const current = parseVariantStickyParam(currentVariantParam)

  return {
    variant: serializeVariantStickyParam(updateVariantSelection(current, type, variantId)),
    ...(perspective
      ? {
          excludedPerspectives: null,
          perspective: getPerspectiveParam(perspective, defaultPerspective),
        }
      : {}),
  }
}

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
    (options) => {
      router.navigate({
        stickyParams: getVariantStickyParams(
          options,
          typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined,
          defaultPerspective,
        ),
      })
    },
    [router, defaultPerspective],
  )
}
