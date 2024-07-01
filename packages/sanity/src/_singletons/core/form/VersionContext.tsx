// eslint-disable-next-line no-warning-comments
/* TODO REMOVE THIS, THIS IS JUST A TEMPORARY FIX UNTIL STORES ARE SET UP */

// eslint-disable-next-line import/consistent-type-specifier-style
import {createContext, type ReactElement, useState} from 'react'

import type {Version} from '../../../core/versions/types'
import {LATEST} from '../../../core/versions/util/const'

interface VersionContextValue {
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
  const [currentVersion, setCurrentVersion] = useState<Version>(LATEST)
  const isDraft = currentVersion.name === 'drafts'

  const contextValue: VersionContextValue = {
    currentVersion,
    isDraft,
    setCurrentVersion,
  }

  return <VersionContext.Provider value={contextValue}>{children}</VersionContext.Provider>
}
