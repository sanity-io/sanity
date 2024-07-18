import {type SanityDocument} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {omit} from 'lodash'
import {useCallback} from 'react'
import {getPublishedId, useCurrentUser} from 'sanity'

import {useClient} from '../../hooks'
import {useAddonDataset} from '../../studio/addonDataset/useAddonDataset'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {type BundleDocument} from './types'

// WIP - Raw implementation for initial testing purposes
export function useBundleOperations() {
  const {client} = useAddonDataset()
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const currentUser = useCurrentUser()

  const handleCreateBundle = useCallback(
    async (bundle: Partial<BundleDocument>) => {
      const document = {
        ...bundle,
        _type: 'bundle',
        authorId: currentUser?.id,
        _id: bundle._id ?? uuid(),
      } as BundleDocument
      const res = await client?.createIfNotExists(document)
      return res
    },
    [client, currentUser?.id],
  )

  const handleDeleteBundle = useCallback(
    async (bundle: BundleDocument) => {
      // Fetch the related version documents from the main dataset, this documents will be removed
      const versionDocuments = await studioClient.fetch<SanityDocument[]>(
        `*[defined(_version) && _id in path("${bundle.slug}.*")]`,
      )
      // Starts the transaction to remove the documents.
      const transaction = studioClient.transaction()
      versionDocuments.forEach((doc) => {
        transaction.delete(doc._id)
      })
      await transaction.commit()
      // Remove the bundle metadata document from the addon dataset
      const res = await client?.delete(bundle._id)
      return res
    },
    [client, studioClient],
  )

  const handleUpdateBundle = useCallback(
    async (bundle: Partial<BundleDocument>) => {
      if (!client || !bundle._id) return null

      const document = {
        ...bundle,
        _type: 'bundle',
      } as BundleDocument
      const unsetKeys = Object.entries(bundle)
        .filter(([_, value]) => value === undefined)
        .map(([key]) => key)

      let clientOperation = client.patch(bundle._id).set(document)
      if (unsetKeys.length) {
        clientOperation = clientOperation.unset(unsetKeys)
      }

      return clientOperation.commit()
    },
    [client],
  )

  const handlePublishBundle = useCallback(
    async (bundleId: string, bundleDocuments: SanityDocument[]) => {
      if (!client) return null

      const transaction = studioClient.transaction()
      bundleDocuments.forEach((document) => {
        const transactionDocument = omit(document, ['_version']) as SanityDocument

        // update the published document with the bundle version
        transaction.createOrReplace({
          ...transactionDocument,
          _id: getPublishedId(document._id, true),
        })
        // delete the bundle version document
        transaction.delete(document._id)
      })

      const {transactionId} = await transaction.commit()
      const publishedAt = new Date().toISOString()
      return await client
        .patch(bundleId)
        .set({publishedAt, archivedAt: publishedAt, publishedRev: transactionId})
        .commit()
    },
    [client, studioClient],
  )

  return {
    createBundle: handleCreateBundle,
    deleteBundle: handleDeleteBundle,
    updateBundle: handleUpdateBundle,
    publishBundle: handlePublishBundle,
  }
}
