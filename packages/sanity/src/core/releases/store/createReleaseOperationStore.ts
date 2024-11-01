import {
  type Action,
  type EditAction,
  type IdentifiedSanityDocumentStub,
  type SanityClient,
} from '@sanity/client'
import {type User} from '@sanity/types'

import {getVersionId} from '../../util'
import {getBundleIdFromReleaseDocumentId} from '../index'
import {RELEASE_METADATA_TMP_DOC_PATH, RELEASE_METADATA_TMP_DOC_TYPE} from './constants'
import {type EditableReleaseDocument} from './types'

export interface ReleaseOperationsStore {
  publishRelease: (releaseId: string) => Promise<void>
  schedule: (releaseId: string, date: Date) => Promise<void>
  //todo: reschedule: (releaseId: string, newDate: Date) => Promise<void>
  unschedule: (releaseId: string) => Promise<void>
  archive: (releaseId: string) => Promise<void>
  unarchive: (releaseId: string) => Promise<void>
  updateRelease: (release: EditableReleaseDocument) => Promise<void>
  createRelease: (release: EditableReleaseDocument) => Promise<void>
  createVersion: (releaseId: string, documentId: string) => Promise<void>
  discardVersion: (releaseId: string, documentId: string) => Promise<void>
}

const IS_CREATE_VERSION_ACTION_SUPPORTED = false
const IS_RELEASE_METADATA_PROPERTIES_SUPPORTED = false
const IS_RELEASE_EDIT_SUPPORTED = false

export function createReleaseOperationsStore(options: {
  client: SanityClient
  currentUser: User
}): ReleaseOperationsStore {
  const {client, currentUser} = options
  const handleCreateRelease = async (release: EditableReleaseDocument) => {
    if (IS_RELEASE_METADATA_PROPERTIES_SUPPORTED) {
      await requestAction(client, {
        actionType: 'sanity.action.release.create',
        releaseId: getBundleIdFromReleaseDocumentId(release._id),
      })
      await requestAction(client, {
        actionType: 'sanity.action.release.create',
        releaseId: getBundleIdFromReleaseDocumentId(release._id),
        // @ts-expect-error - this is TBD
        metadata: release,
      })
    } else {
      // todo: remove once metadata properties are supported
      const bundleId = getBundleIdFromReleaseDocumentId(release._id)
      const metadataDocument = {
        ...release,
        _id: `${RELEASE_METADATA_TMP_DOC_PATH}.${bundleId}`,
        _type: RELEASE_METADATA_TMP_DOC_TYPE,
      }
      await requestAction(client, {
        actionType: 'sanity.action.release.create',
        releaseId: getBundleIdFromReleaseDocumentId(release._id),
      })
      await client.createIfNotExists(metadataDocument)
    }
  }

  const handleUpdateRelease = async (release: EditableReleaseDocument) => {
    const bundleId = getBundleIdFromReleaseDocumentId(release._id)

    const unsetKeys = Object.entries(release)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => `metadata.${key}`)

    if (IS_RELEASE_EDIT_SUPPORTED) {
      await requestAction(client, {
        actionType: 'sanity.action.release.edit',
        releaseId: bundleId,
        patch: {
          // todo: consider more granular updates here
          set: {metadata: release.metadata},
          unset: unsetKeys,
        },
      })
    } else {
      // todo: delete when `sanity.action.release.edit` action is supported for custom metadata/attributes
      const metadataDocument = {
        ...release,
        _id: `${RELEASE_METADATA_TMP_DOC_PATH}.${bundleId}`,
        _type: RELEASE_METADATA_TMP_DOC_TYPE,
        authorId: currentUser?.id,
      }

      let clientOperation = client.patch(metadataDocument._id).set(metadataDocument)
      if (unsetKeys.length) {
        clientOperation = clientOperation.unset(unsetKeys)
      }

      await clientOperation.commit()
    }
  }

  const handlePublishRelease = async (releaseId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.release.publish',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])

  const handleScheduleRelease = async (releaseId: string, publishAt: Date) => {
    await requestAction(client, [
      {
        actionType: 'sanity.action.release.schedule',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
        publishAt: publishAt.toISOString(),
      },
    ])
  }
  const handleUnscheduleRelease = async (releaseId: string) => {
    await requestAction(client, [
      {
        actionType: 'sanity.action.release.unschedule',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])
  }

  const handleArchiveRelease = async (releaseId: string) => {
    await requestAction(client, [
      {
        actionType: 'sanity.action.release.archive',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])
  }

  const handleUnarchiveRelease = async (releaseId: string) => {
    await requestAction(client, [
      {
        actionType: 'sanity.action.release.unarchive',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])
  }

  const handleCreateVersion = async (releaseId: string, documentId: string) => {
    // the documentId will show you where the document is coming from and which
    // document should it copy from

    // fetch original document
    const document = await client.getDocument(documentId)

    if (!document) {
      throw new Error(`Document with id ${documentId} not found`)
    }

    const versionDocument = {
      ...document,
      _id: getVersionId(documentId, releaseId),
    } as IdentifiedSanityDocumentStub

    await (IS_CREATE_VERSION_ACTION_SUPPORTED
      ? requestAction(client, [
          {
            actionType: 'sanity.action.document.createVersion',
            releaseId: getBundleIdFromReleaseDocumentId(releaseId),
            attributes: versionDocument,
          },
        ])
      : client.create(versionDocument))
  }

  const handleDiscardVersion = async (releaseId: string, documentId: string) => {
    if (!document) {
      throw new Error(`Document with id ${documentId} not found`)
    }

    await requestAction(client, [
      {
        actionType: 'sanity.action.document.discard',
        draftId: getVersionId(documentId, releaseId),
      },
    ])
  }

  return {
    archive: handleArchiveRelease,
    unarchive: handleUnarchiveRelease,
    schedule: handleScheduleRelease,
    unschedule: handleUnscheduleRelease,
    createRelease: handleCreateRelease,
    updateRelease: handleUpdateRelease,
    publishRelease: handlePublishRelease,
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
  }
}

interface ScheduleApiAction {
  actionType: 'sanity.action.release.schedule'
  releaseId: string
  publishAt: string
}

interface PublishApiAction {
  actionType: 'sanity.action.release.publish'
  releaseId: string
}

interface ArchiveApiAction {
  actionType: 'sanity.action.release.archive'
  releaseId: string
}

interface UnarchiveApiAction {
  actionType: 'sanity.action.release.unarchive'
  releaseId: string
}

interface UnscheduleApiAction {
  actionType: 'sanity.action.release.unschedule'
  releaseId: string
}

interface CreateReleaseApiAction {
  actionType: 'sanity.action.release.create'
  releaseId: string
}

interface CreateVersionReleaseApiAction {
  actionType: 'sanity.action.document.createVersion'
  releaseId: string
  attributes: IdentifiedSanityDocumentStub
}

// Todo: not supported by backend yet – this is me guessing what it will look like
interface EditReleaseApiAction {
  actionType: 'sanity.action.release.edit'
  releaseId: string
  patch: EditAction['patch']
}

type ReleaseAction =
  | Action
  | ScheduleApiAction
  | PublishApiAction
  | CreateReleaseApiAction
  | EditReleaseApiAction
  | UnscheduleApiAction
  | ArchiveApiAction
  | UnarchiveApiAction
  | CreateVersionReleaseApiAction

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
