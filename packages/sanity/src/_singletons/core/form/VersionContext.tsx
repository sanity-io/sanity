// eslint-disable-next-line no-warning-comments
/* TODO DO WE STILL NEED THIS AFTER THE STORES ARE SET UP? */

// eslint-disable-next-line import/consistent-type-specifier-style
import {createContext, type ReactElement} from 'react'

import type {Version} from '../../../core/versions/types'
import {BUNDLES, LATEST} from '../../../core/versions/util/const'
import {useRouter} from '../../../router'

export interface VersionContextValue {
  currentVersion: Version
  isDraft: boolean
  setCurrentVersion: (version: Version) => void
}

export const VersionContext = createContext<VersionContextValue>({
  currentVersion: LATEST,
  isDraft: true,
  // eslint-disable-next-line no-empty-function
  setCurrentVersion: () => {},
})

interface VersionProviderProps {
  children: ReactElement
}

export function VersionProvider({children}: VersionProviderProps): JSX.Element {
  const router = useRouter()
  const setCurrentVersion = (version: Version) => {
    const {name} = version
    if (name === 'drafts') {
      router.navigateStickyParam('perspective', '')
    } else {
      router.navigateStickyParam('perspective', `bundle.${name}`)
    }
  }
  const selectedVersion = router.stickyParams?.perspective
    ? BUNDLES.find((bundle) => {
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
