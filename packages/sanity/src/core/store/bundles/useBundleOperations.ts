import {type SanityDocument} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {omit} from 'lodash'
import {useCallback} from 'react'
import {getPublishedId, useCurrentUser} from 'sanity'

import {useClient} from '../../hooks'
import {useAddonDataset} from '../../studio/addonDataset/useAddonDataset'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {type BundleDocument} from './types'

const useGuardedAddonClient = () => {
  const {client: addOnClient, createAddonDataset} = useAddonDataset()

  function getAddonClient() {
    if (!addOnClient) {
      throw new Error('Addon client is not available')
    }

    return addOnClient
  }
  async function getOrCreateAddonClient() {
    if (!addOnClient) {
      const client = await createAddonDataset()
      if (!client) {
        throw new Error('There was an error creating the addon client')
      }
      return client
    }
    return addOnClient
  }

  return {getAddonClient, getOrCreateAddonClient}
}

// WIP - Raw implementation for initial testing purposes
export function useBundleOperations() {
  const {getAddonClient, getOrCreateAddonClient} = useGuardedAddonClient()
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const currentUser = useCurrentUser()

  const handleCreateBundle = useCallback(
    async (bundle: Partial<BundleDocument>) => {
      const addonClient = await getOrCreateAddonClient()

      const document = {
        ...bundle,
        _type: 'bundle',
        authorId: currentUser?.id,
        _id: bundle._id ?? uuid(),
      } as BundleDocument
      const res = await addonClient.createIfNotExists(document)
      return res
    },
    [currentUser?.id, getOrCreateAddonClient],
  )

  const handleDeleteBundle = useCallback(
    async (bundle: BundleDocument) => {
      const addonClient = getAddonClient()

      // Fetch the related version documents from the main dataset, this documents will be removed
      const versionDocuments = await studioClient.fetch<SanityDocument[]>(
        `_id in path("versions.${bundle.slug}.*")]`,
      )
      // Starts the transaction to remove the documents.
      const transaction = studioClient.transaction()
      versionDocuments.forEach((doc) => {
        transaction.delete(doc._id)
      })
      await transaction.commit()
      // Remove the bundle metadata document from the addon dataset
      const res = await addonClient.delete(bundle._id)
      return res
    },
    [getAddonClient, studioClient],
  )

  const handleUpdateBundle = useCallback(
    async (bundle: Partial<BundleDocument>) => {
      const addonClient = getAddonClient()
      if (!bundle._id) return null

      const document = {
        ...bundle,
        _type: 'bundle',
      } as BundleDocument
      const unsetKeys = Object.entries(bundle)
        .filter(([_, value]) => value === undefined)
        .map(([key]) => key)

      let clientOperation = addonClient.patch(bundle._id).set(document)
      if (unsetKeys.length) {
        clientOperation = clientOperation.unset(unsetKeys)
      }

      return clientOperation.commit()
    },
    [getAddonClient],
  )

  const handlePublishBundle = useCallback(
    async (
      bundleId: string,
      bundleDocuments: SanityDocument[],
      publishedDocumentsRevisions: Record<string, string>,
    ) => {
      const addonClient = getAddonClient()

      const transaction = studioClient.transaction()
      bundleDocuments.forEach((bundleDocument) => {
        const publishedDocumentId = getPublishedId(bundleDocument._id)
        const versionDocument = omit(bundleDocument, ['_version']) as SanityDocument
        const publishedDocumentRevisionId = publishedDocumentsRevisions[publishedDocumentId]

        const publishedDocument = {
          ...versionDocument,
          _id: publishedDocumentId,
        }
        // verify that local bundle document matches remote latest revision
        transaction.patch(bundleDocument._id, {
          unset: ['_revision_lock_pseudo_field_'],
          ifRevisionID: bundleDocument._rev,
        })

        if (publishedDocumentRevisionId) {
          // if published document exists, verify that local document matches remote latest revision
          transaction.patch(publishedDocumentId, {
            unset: ['_revision_lock_pseudo_field_'],
            ifRevisionID: publishedDocumentRevisionId,
          })
          // update the published document with the bundle version
          transaction.createOrReplace(publishedDocument)
        } else {
          // if published document doesn't exist, do not override
          // only create the document and fail is it suddenly exists
          transaction.create(publishedDocument)
        }
      })

      await transaction.commit()
      const publishedAt = new Date().toISOString()
      return await addonClient.patch(bundleId).set({publishedAt, archivedAt: publishedAt}).commit()
    },
    [getAddonClient, studioClient],
  )

  return {
    createBundle: handleCreateBundle,
    deleteBundle: handleDeleteBundle,
    updateBundle: handleUpdateBundle,
    publishBundle: handlePublishBundle,
  }
}
