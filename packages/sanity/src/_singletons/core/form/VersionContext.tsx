// eslint-disable-next-line no-warning-comments
/* TODO REMOVE THIS, THIS IS JUST A TEMPORARY FIX UNTIL STORES ARE SET UP */

import type {createContext, React, ReactNode, useState} from 'react'

import type {LATEST, Version} from '../../../core/util/versions/util'

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

export const VersionProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [currentVersion, setCurrentVersion] = useState<Version>(LATEST)
  const isDraft = currentVersion.name === 'draft'

  const contextValue: VersionContextValue = {
    currentVersion,
    isDraft,
    setCurrentVersion,
  }

  return <VersionContext.Provider value={contextValue}>{children}</VersionContext.Provider>
}
