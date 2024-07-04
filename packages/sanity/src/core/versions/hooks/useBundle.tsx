import {useRouter} from 'sanity/router'

import {useBundlesStore} from '../../store/bundles'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'

/**
 * @internal
 */
export interface VersionContextValue {
  currentBundle: Partial<BundleDocument>
  isDraft: boolean
  setGlobalBundle: (bundle: Partial<BundleDocument>) => void
}

export function useBundle(): VersionContextValue {
  const router = useRouter()
  const {data: bundles} = useBundlesStore()

  const setGlobalBundle = (version: Partial<BundleDocument>) => {
    const {name} = version
    if (name === 'drafts') {
      router.navigateStickyParam('perspective', '')
    } else {
      router.navigateStickyParam('perspective', `bundle.${name}`)
    }
  }
  const selectedPerspective =
    router.stickyParams?.perspective && bundles
      ? bundles.find((bundle: Partial<BundleDocument>) => {
          return (
            `bundle.${bundle.name}`.toLocaleLowerCase() ===
            router.stickyParams.perspective?.toLocaleLowerCase()
          )
        })
      : LATEST

  const currentBundle = selectedPerspective || LATEST

  const isDraft = currentBundle.name === 'drafts'

  return {
    isDraft,
    setGlobalBundle,
    currentBundle,
  }
}
