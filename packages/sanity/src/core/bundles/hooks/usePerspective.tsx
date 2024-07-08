import {useRouter} from 'sanity/router'

import {useBundles} from '../../store/bundles/BundlesProvider'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'

/**
 * @internal
 */
export interface PerspectiveValue {
  /* Return the current global bundle */
  currentGlobalBundle: Partial<BundleDocument>
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (name: string) => void
}

/**
 * @internal
 */
export function usePerspective(): PerspectiveValue {
  const router = useRouter()
  const {data: bundles} = useBundles()

  const setPerspective = (name: string | undefined) => {
    if (name === 'drafts') {
      router.navigateStickyParam('perspective', '')
    } else {
      router.navigateStickyParam('perspective', `bundle.${name}`)
    }
  }
  const selectedBundle =
    router.stickyParams?.perspective && bundles
      ? bundles.find((bundle: Partial<BundleDocument>) => {
          return (
            `bundle.${bundle.name}`.toLocaleLowerCase() ===
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
