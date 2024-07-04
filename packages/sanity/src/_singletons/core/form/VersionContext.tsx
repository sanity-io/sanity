import {createContext} from 'react'

import type {VersionContextValue} from '../../../core/versions/context/useVersion'
import {LATEST} from '../../../core/versions/util/const'

/**
 * @internal
 */
export const VersionContext = createContext<VersionContextValue>({
  currentVersion: LATEST,
  isDraft: true,
  // eslint-disable-next-line no-empty-function
  setCurrentVersion: () => {},
})
