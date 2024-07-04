import {type ReactElement} from 'react'
import {useRouter} from 'sanity/router'

import {VersionContext} from '../../../_singletons/core/form/VersionContext'
import {useBundlesStore} from '../../store/bundles'
import {type BundleDocument} from '../../store/bundles/types'
import {LATEST} from '../util/const'
import {type VersionContextValue} from './useVersion'

interface VersionProviderProps {
  children: ReactElement
}

export function VersionProvider({children}: VersionProviderProps): JSX.Element {
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
      ? bundles.find((bundle) => {
          return (
            `bundle.${bundle.name}`.toLocaleLowerCase() ===
            router.stickyParams.perspective?.toLocaleLowerCase()
          )
        })
      : LATEST

  const currentVersion = selectedVersion || LATEST

  const isDraft = currentVersion.name === 'drafts'

  const contextValue: VersionContextValue = {
    isDraft,
    setCurrentVersion,
    currentVersion,
  }

  return <VersionContext.Provider value={contextValue}>{children}</VersionContext.Provider>
}
