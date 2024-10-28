import {type Action, type SanityClient, type SanityDocument} from '@sanity/client'
import {type User} from '@sanity/types'
import {omit} from 'lodash'
import {
  type EditableReleaseDocument,
  getBundleIdFromReleaseId,
  getPublishedId,
  getVersionId,
} from 'sanity'

import {RELEASE_METADATA_TMP_DOC_PATH, RELEASE_METADATA_TMP_DOC_TYPE} from './constants'

export interface ReleaseOperationsStore {
  publishRelease: (
    releaseId: string,
    releaseDocuments: SanityDocument[],
    publishedDocumentsRevisions: Record<string, string>,
  ) => Promise<void>
  schedule: (releaseId: string, date: Date) => Promise<void>
  //todo: reschedule: (releaseId: string, newDate: Date) => Promise<void>
  unschedule: (releaseId: string) => Promise<void>
  updateRelease: (release: EditableReleaseDocument) => Promise<void>
  createRelease: (release: EditableReleaseDocument) => Promise<void>
  createVersion: (releaseId: string, documentId: string) => Promise<void>
}

export function createReleaseOperationsStore(options: {
  client: SanityClient
  currentUser: User
}): ReleaseOperationsStore {
  const {client, currentUser} = options
  const handleCreateRelease = async (release: EditableReleaseDocument) => {
    const bundleId = getBundleIdFromReleaseId(release._id)
    const metadataDocument = {
      ...release,
      _id: `${RELEASE_METADATA_TMP_DOC_PATH}.${bundleId}`,
      _type: RELEASE_METADATA_TMP_DOC_TYPE,
      authorId: currentUser?.id,
    }
    await requestAction(client, {
      actionType: 'sanity.action.release.create',
      releaseId: getBundleIdFromReleaseId(release._id),
    })
    await client.createIfNotExists(metadataDocument)
  }

  const handleUpdateRelease = async (release: EditableReleaseDocument) => {
    if (!release._id) {
      return
    }

    const bundleId = getBundleIdFromReleaseId(release._id)
    // todo: update system document when `sanity.action.release.edit` action is supported
    const metadataDocument = {
      ...release,
      _id: `${RELEASE_METADATA_TMP_DOC_PATH}.${bundleId}`,
      _type: RELEASE_METADATA_TMP_DOC_TYPE,
      authorId: currentUser?.id,
    }

    const unsetKeys = Object.entries(release)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => key)

    let clientOperation = client.patch(metadataDocument._id).set(metadataDocument)
    if (unsetKeys.length) {
      clientOperation = clientOperation.unset(unsetKeys)
    }

    await clientOperation.commit()
  }

  const handlePublishRelease = async (
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
  const handleScheduleRelease = (releaseId: string, publishAt: Date) => {
    return requestAction(client, [
      {
        actionType: 'sanity.action.release.schedule',
        releaseId: getBundleIdFromReleaseId(releaseId),
        publishAt: publishAt.toISOString(),
      },
    ]).then(() => {})
  }
  const handleUnscheduleRelease = (releaseId: string) => {
    return requestAction(client, [
      {
        actionType: 'sanity.action.release.unschedule',
        releaseId: getBundleIdFromReleaseId(releaseId),
      },
    ]).then(() => {})
  }

  const handleCreateVersion = async (documentId: string, releaseId: string) => {
    // fetch original document
    const doc = await client.fetch(`*[_id == $documentId][0]`, {documentId})

    return client.create({...doc, _id: getVersionId(documentId, releaseId)}).then(() => {})
  }

  return {
    schedule: handleScheduleRelease,
    unschedule: handleUnscheduleRelease,
    createRelease: handleCreateRelease,
    updateRelease: handleUpdateRelease,
    publishRelease: handlePublishRelease,
    createVersion: handleCreateVersion,
  }
}

interface ScheduleApiAction {
  actionType: 'sanity.action.release.schedule'
  releaseId: string
  publishAt: string
}
interface UnscheduleApiAction {
  actionType: 'sanity.action.release.unschedule'
  releaseId: string
}

interface CreateReleaseApiAction {
  actionType: 'sanity.action.release.create'
  releaseId: string
}

// Todo: implement - not supported by backend yet
interface EditReleaseApiAction {
  actionType: 'sanity.action.release.edit'
  releaseId: string
}

type ReleaseAction = Action | ScheduleApiAction | CreateReleaseApiAction | UnscheduleApiAction

function requestAction(client: SanityClient, actions: ReleaseAction | ReleaseAction[]) {
  const {dataset} = client.config()
  return client.request({
    uri: `/data/actions/${dataset}`,
    method: 'POST',
    body: {
      actions: Array.isArray(actions) ? actions : [actions],
    },
  })
}
