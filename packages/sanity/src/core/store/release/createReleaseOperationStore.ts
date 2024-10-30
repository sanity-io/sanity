import {type Action, type SanityClient} from '@sanity/client'
import {type User} from '@sanity/types'

import {getBundleIdFromReleaseId} from '../../releases'
import {getVersionId} from '../../util'
import {RELEASE_METADATA_TMP_DOC_PATH, RELEASE_METADATA_TMP_DOC_TYPE} from './constants'
import {type EditableReleaseDocument} from './types'

export interface ReleaseOperationsStore {
  publishRelease: (releaseId: string) => Promise<void>
  schedule: (releaseId: string, date: Date) => Promise<void>
  //todo: reschedule: (releaseId: string, newDate: Date) => Promise<void>
  unschedule: (releaseId: string) => Promise<void>
  archive: (releaseId: string) => Promise<void>
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

  const handlePublishRelease = async (releaseId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.release.publish',
        releaseId: getBundleIdFromReleaseId(releaseId),
        useSystemDocument: true,
      },
    ])

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

  const handleArchiveRelease = (releaseId: string) => {
    return requestAction(client, [
      {
        actionType: 'sanity.action.release.archive',
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
    archive: handleArchiveRelease,
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

interface PublishApiAction {
  actionType: 'sanity.action.release.publish'
  releaseId: string
  useSystemDocument: true
}

interface ArchiveApiAction {
  actionType: 'sanity.action.release.archive'
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

// Todo: implement - not supported by backend yet
interface EditReleaseApiAction {
  actionType: 'sanity.action.release.edit'
  releaseId: string
}

type ReleaseAction =
  | Action
  | ScheduleApiAction
  | PublishApiAction
  | CreateReleaseApiAction
  | UnscheduleApiAction
  | ArchiveApiAction

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
