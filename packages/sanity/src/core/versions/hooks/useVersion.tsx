import {useRouter} from 'sanity/router'

import {useBundlesStore} from '../../store/bundles'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'

/**
 * @internal
 */
export interface VersionContextValue {
  currentVersion: Partial<BundleDocument>
  isDraft: boolean
  setCurrentVersion: (bundle: Partial<BundleDocument>) => void
}

export function useVersion(): VersionContextValue {
  const router = useRouter()
  const {data: bundles} = useBundlesStore()

  const setCurrentVersion = (version: Partial<BundleDocument>) => {
    const {name} = version
    if (name === 'drafts') {
      router.navigateStickyParam('perspective', '')
    } else {
      router.navigateStickyParam('perspective', `bundle.${name}`)
    }
  }
  const selectedVersion =
    router.stickyParams?.perspective && bundles
      ? bundles.find((bundle: Partial<BundleDocument>) => {
          return (
            `bundle.${bundle.name}`.toLocaleLowerCase() ===
            router.stickyParams.perspective?.toLocaleLowerCase()
          )
        })
      : LATEST

  const currentVersion = selectedVersion || LATEST

  const isDraft = currentVersion.name === 'drafts'

  return {
    isDraft,
    setCurrentVersion,
    currentVersion,
  }
}
