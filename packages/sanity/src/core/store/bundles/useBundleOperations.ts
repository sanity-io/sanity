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
  const {client: addOnClient} = useAddonDataset()
  const studioClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const currentUser = useCurrentUser()

  const handleCreateBundle = useCallback(
    async (bundle: Partial<BundleDocument>) => {
      if (!addOnClient) return null

      const document = {
        ...bundle,
        _type: 'bundle',
        authorId: currentUser?.id,
        _id: bundle._id ?? uuid(),
      } as BundleDocument
      const res = await addOnClient.createIfNotExists(document)
      return res
    },
    [addOnClient, currentUser?.id],
  )

  const handleDeleteBundle = useCallback(
    async (bundle: BundleDocument) => {
      if (!addOnClient) return null

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
      const res = await addOnClient.delete(bundle._id)
      return res
    },
    [addOnClient, studioClient],
  )

  const handleUpdateBundle = useCallback(
    async (bundle: Partial<BundleDocument>) => {
      if (!addOnClient || !bundle._id) return null

      const document = {
        ...bundle,
        _type: 'bundle',
      } as BundleDocument
      const unsetKeys = Object.entries(bundle)
        .filter(([_, value]) => value === undefined)
        .map(([key]) => key)

      let clientOperation = addOnClient.patch(bundle._id).set(document)
      if (unsetKeys.length) {
        clientOperation = clientOperation.unset(unsetKeys)
      }

      return clientOperation.commit()
    },
    [addOnClient],
  )

  const handlePublishBundle = useCallback(
    async (
      bundleId: string,
      bundleDocuments: SanityDocument[],
      publishedDocumentsRevisions: Record<string, string> = {},
    ) => {
      if (!addOnClient) return null

      const transaction = studioClient.transaction()
      bundleDocuments.forEach((bundleDocument) => {
        const publishedDocumentId = getPublishedId(bundleDocument._id, true)
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
      return await addOnClient.patch(bundleId).set({publishedAt, archivedAt: publishedAt}).commit()
    },
    [addOnClient, studioClient],
  )

  const guardForAddOnClient = <Callback extends (...args: any[]) => any>(
    callbackOperation: Callback,
  ) => {
    return (...args: Parameters<Callback>): ReturnType<Callback> => {
      if (!addOnClient) {
        throw new Error('No addon client found. Unable to perform operation.')
      }

      return callbackOperation(...args)
    }
  }

  return {
    createBundle: guardForAddOnClient(handleCreateBundle),
    deleteBundle: guardForAddOnClient(handleDeleteBundle),
    updateBundle: guardForAddOnClient(handleUpdateBundle),
    publishBundle: guardForAddOnClient(handlePublishBundle),
  }
}
