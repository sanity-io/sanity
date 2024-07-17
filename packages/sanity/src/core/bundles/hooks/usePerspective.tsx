import {useRouter} from 'sanity/router'

import {useBundles} from '../../store/bundles'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'

/**
 * @internal
 */
export interface PerspectiveValue {
  /* Return the current global bundle */
  currentGlobalBundle: Partial<BundleDocument>
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (slug: string) => void
}

/**
 * @internal
 */
export function usePerspective(): PerspectiveValue {
  const router = useRouter()
  const {data: bundles} = useBundles()

  const setPerspective = (slug: string | undefined) => {
    if (slug === 'drafts') {
      router.navigateStickyParam('perspective', '')
    } else {
      router.navigateStickyParam('perspective', `bundle.${slug}`)
    }
  }
  const selectedBundle =
    router.stickyParams?.perspective && bundles
      ? bundles.find((bundle: Partial<BundleDocument>) => {
          return (
            `bundle.${bundle.slug}`.toLocaleLowerCase() ===
            router.stickyParams.perspective?.toLocaleLowerCase()
          )
        })
      : LATEST

  const currentGlobalBundle = selectedBundle || LATEST

  return {
    setPerspective,
    currentGlobalBundle,
  }
}
