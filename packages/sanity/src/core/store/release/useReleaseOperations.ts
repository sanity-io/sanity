import {type SanityDocument} from '@sanity/client'
import {omit} from 'lodash'
import {useCallback} from 'react'
import {type EditableReleaseDocument, getPublishedId, useCurrentUser} from 'sanity'

import {useClient} from '../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {RELEASE_DOCUMENT_TYPE} from './constants'

// WIP - Raw implementation for initial testing purposes
/** @internal */
export function useReleaseOperations() {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const currentUser = useCurrentUser()

  const handleCreateRelease = useCallback(
    async (release: EditableReleaseDocument) => {
      const document = {
        ...release,
        _type: RELEASE_DOCUMENT_TYPE,
        authorId: currentUser?.id,
      }
      await client.createIfNotExists(document)
    },
    [client, currentUser?.id],
  )

  const handleUpdateRelease = useCallback(
    async (release: EditableReleaseDocument) => {
      if (!release._id) return null

      const document = {
        ...release,
        _type: RELEASE_DOCUMENT_TYPE,
      }
      const unsetKeys = Object.entries(release)
        .filter(([_, value]) => value === undefined)
        .map(([key]) => key)

      let clientOperation = client.patch(release._id).set(document)
      if (unsetKeys.length) {
        clientOperation = clientOperation.unset(unsetKeys)
      }

      return clientOperation.commit()
    },
    [client],
  )

  const handlePublishBundle = useCallback(
    async (
      bundleId: string,
      bundleDocuments: SanityDocument[],
      publishedDocumentsRevisions: Record<string, string>,
    ) => {
      const transaction = client.transaction()
      bundleDocuments.forEach((bundleDocument) => {
        const publishedDocumentId = getPublishedId(bundleDocument._id)
        const versionDocument = omit(bundleDocument, ['_version']) as SanityDocument
        const publishedDocumentRevisionId = publishedDocumentsRevisions[publishedDocumentId]

        const publishedDocument = {
          ...versionDocument,
          _id: publishedDocumentId,
        }
        // verify that local release document matches remote latest revision
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
          // update the published document with the release version
          transaction.createOrReplace(publishedDocument)
        } else {
          // if published document doesn't exist, do not override
          // only create the document and fail is it suddenly exists
          transaction.create(publishedDocument)
        }
      })

      await transaction.commit()
      const publishedAt = new Date().toISOString()
      return await client.patch(bundleId).set({publishedAt, archivedAt: publishedAt}).commit()
    },
    [client],
  )

  return {
    createRelease: handleCreateRelease,
    updateRelease: handleUpdateRelease,
    publishRelease: handlePublishBundle,
  }
}
