import {use} from 'react'
import {AddonDatasetContext} from 'sanity/_singletons'

import {type AddonDatasetContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export function useAddonDataset(): AddonDatasetContextValue {
  const ctx = use(AddonDatasetContext)

  if (!ctx) {
    throw new Error('useAddonDataset: missing context value')
  }

  return ctx
}
