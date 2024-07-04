import {useContext} from 'react'

import {VersionContext} from '../../../_singletons/core/form/VersionContext'
import {type BundleDocument} from '../../store/bundles/types'

/**
 * @internal
 */
export interface VersionContextValue {
  currentVersion: Partial<BundleDocument>
  isDraft: boolean
  setCurrentVersion: (bundle: Partial<BundleDocument>) => void
}

export function useVersion(): VersionContextValue {
  const context = useContext(VersionContext)
  if (!context) {
    throw new Error('useVersion must be used within a VersionProvider')
  }
  return context
}
