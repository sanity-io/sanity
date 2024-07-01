import {uuid} from '@sanity/uuid'
import {useCallback} from 'react'

import {useAddonDataset} from '../../studio/addonDataset/useAddonDataset'
import {type BundleDocument} from './types'

// WIP - Raw implementation for initial testing purposes
export function useBundleOperations() {
  const {client} = useAddonDataset()

  const handleCreateBundle = useCallback(
    async (bundle: Partial<BundleDocument>) => {
      const document = {
        ...bundle,
        _type: 'bundle',
        _id: bundle._id ?? uuid(),
      } as BundleDocument
      const res = await client?.createIfNotExists(document)
      return res
    },
    [client],
  )

  const handleDeleteBundle = useCallback(
    async (id: string) => {
      const res = await client?.delete(id)
      return res
    },
    [client],
  )

  const handleUpdateBundle = useCallback(
    async (bundle: BundleDocument) => {
      const document = {
        ...bundle,
        _type: 'bundle',
      } as BundleDocument

      const res = await client?.patch(bundle._id).set(document).commit()
      return res
    },
    [client],
  )

  return {
    createBundle: handleCreateBundle,
    deleteBundle: handleDeleteBundle,
    updateBundle: handleUpdateBundle,
  }
}
