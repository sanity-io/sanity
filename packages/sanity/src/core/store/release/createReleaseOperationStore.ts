import {type SanityClient, type SanityDocument} from '@sanity/client'
import {type User} from '@sanity/types'
import {omit} from 'lodash'
import {type EditableReleaseDocument, getPublishedId} from 'sanity'

import {RELEASE_DOCUMENT_TYPE} from './constants'

export interface ReleaseOperationsStore {
  publishRelease: (
    bundleId: string,
    bundleDocuments: SanityDocument[],
    publishedDocumentsRevisions: Record<string, string>,
  ) => Promise<void>
  updateRelease: (bundle: EditableReleaseDocument) => Promise<void>
  createRelease: (bundle: EditableReleaseDocument) => Promise<void>
}

export function createReleaseOperationsStore(options: {
  client: SanityClient
  currentUser: User
}): ReleaseOperationsStore {
  const {client, currentUser} = options
  const handleCreateRelease = async (release: EditableReleaseDocument) => {
    const document = {
      ...release,
      _type: RELEASE_DOCUMENT_TYPE,
      authorId: currentUser?.id,
    }
    await client.createIfNotExists(document)
  }

  const handleUpdateRelease = async (release: EditableReleaseDocument) => {
    if (!release._id) {
      return
    }

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

    await clientOperation.commit()
  }

  const handlePublishBundle = async (
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
    await client.patch(bundleId).set({publishedAt, archivedAt: publishedAt}).commit()
  }
  return {
    createRelease: handleCreateRelease,
    updateRelease: handleUpdateRelease,
    publishRelease: handlePublishBundle,
  }
}
