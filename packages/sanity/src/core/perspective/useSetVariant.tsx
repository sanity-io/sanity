import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {getVariantId} from '../variants/tool/util'
import {type SystemVariant} from '../variants/types'

/**
 * React hook to set the variant in the router.
 * Do not use in production, this can change in any release.
 * @internal
 * @beta
 */
export function useSetVariant() {
  const router = useRouter()

  const setVariant = useCallback(
    (variant: SystemVariant | undefined) => {
      router.navigate({
        stickyParams: {
          variant: variant ? getVariantId(variant._id) : null,
        },
      })
    },
    [router],
  )
  return setVariant
}
