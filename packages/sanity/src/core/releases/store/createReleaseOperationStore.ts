import {
  type Action,
  type EditAction,
  type IdentifiedSanityDocumentStub,
  type SanityClient,
} from '@sanity/client'

import {getVersionId} from '../../util'
import {getBundleIdFromReleaseDocumentId, type ReleaseDocument} from '../index'
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
  createVersion: (
    releaseId: string,
    documentId: string,
    initialvalue?: Record<string, unknown>,
  ) => Promise<void>
  discardVersion: (releaseId: string, documentId: string) => Promise<void>
}

const IS_CREATE_VERSION_ACTION_SUPPORTED = false
// todo: change to `metadata` once the relevant PR has been deployed
const METADATA_PROPERTY_NAME = 'metadata'

export function createReleaseOperationsStore(options: {
  client: SanityClient
}): ReleaseOperationsStore {
  const {client} = options
  const handleCreateRelease = (release: EditableReleaseDocument) =>
    requestAction(client, {
      actionType: 'sanity.action.release.create',
      releaseId: getBundleIdFromReleaseDocumentId(release._id),
      [METADATA_PROPERTY_NAME]: release.metadata,
    })

  const handleUpdateRelease = async (release: EditableReleaseDocument) => {
    const bundleId = getBundleIdFromReleaseDocumentId(release._id)

    const unsetKeys = Object.entries(release)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => `${METADATA_PROPERTY_NAME}.${key}`)

    await requestAction(client, {
      actionType: 'sanity.action.release.edit',
      releaseId: bundleId,
      patch: {
        // todo: consider more granular updates here
        set: {[METADATA_PROPERTY_NAME]: release.metadata},
        unset: unsetKeys,
      },
    })
  }

  const handlePublishRelease = (releaseId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.release.publish',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])

  const handleScheduleRelease = (releaseId: string, publishAt: Date) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.release.schedule',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
        publishAt: publishAt.toISOString(),
      },
    ])

  const handleUnscheduleRelease = (releaseId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.release.unschedule',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])

  const handleArchiveRelease = (releaseId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.release.archive',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])

  const handleUnarchiveRelease = (releaseId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.release.unarchive',
        releaseId: getBundleIdFromReleaseDocumentId(releaseId),
      },
    ])

  const handleCreateVersion = async (
    releaseId: string,
    documentId: string,
    initialValue?: Record<string, unknown>,
  ) => {
    // the documentId will show you where the document is coming from and which
    // document should it copy from

    // fetch original document
    const document = await client.getDocument(documentId)

    if (!document && !initialValue) {
      throw new Error(`Document with id ${documentId} not found and no initial value provided`)
    }

    const versionDocument = {
      ...(document || initialValue || {}),
      _id: getVersionId(documentId, releaseId),
    } as IdentifiedSanityDocumentStub

    await (IS_CREATE_VERSION_ACTION_SUPPORTED
      ? requestAction(client, [
          {
            actionType: 'sanity.action.document.createVersion',
            releaseId,
            attributes: versionDocument,
          },
        ])
      : client.create(versionDocument))
  }

  const handleDiscardVersion = (releaseId: string, documentId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.document.discard',
        draftId: getVersionId(documentId, releaseId),
      },
    ])

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
  [METADATA_PROPERTY_NAME]?: Partial<ReleaseDocument['metadata']>
}

interface CreateVersionReleaseApiAction {
  actionType: 'sanity.action.document.createVersion'
  releaseId: string
  attributes: IdentifiedSanityDocumentStub
}

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

export function requestAction(client: SanityClient, actions: ReleaseAction | ReleaseAction[]) {
  const {dataset} = client.config()
  return client.request({
    uri: `/data/actions/${dataset}`,
    method: 'POST',
    body: {
      actions: Array.isArray(actions) ? actions : [actions],
    },
  })
}
