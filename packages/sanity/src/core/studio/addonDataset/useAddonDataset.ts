import {type AddonDatasetContextValue} from './types'
import {useContext} from 'react'
import {AddonDatasetContext} from 'sanity/_singletons'

/**
 * @beta
 * @hidden
 */
export function useAddonDataset(): AddonDatasetContextValue {
  const ctx = useContext(AddonDatasetContext)

  if (!ctx) {
    throw new Error('useAddonDataset: missing context value')
  }

  return ctx
}
