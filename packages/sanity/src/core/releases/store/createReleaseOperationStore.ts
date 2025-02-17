import {
  type Action,
  type EditAction,
  type IdentifiedSanityDocumentStub,
  type SanityClient,
} from '@sanity/client'

import {getPublishedId, getVersionId} from '../../util'
import {getReleaseIdFromReleaseDocumentId, type ReleaseDocument} from '../index'
import {type RevertDocument} from '../tool/components/releaseCTAButtons/ReleaseRevertButton/useDocumentRevertStates'
import {isReleaseLimitError} from './isReleaseLimitError'
import {type EditableReleaseDocument} from './types'

interface operationsOptions {
  dryRun?: boolean
  skipCrossDatasetValidation?: boolean
}
export interface ReleaseOperationsStore {
  publishRelease: (
    releaseId: string,
    useUnstableAction?: boolean,
    opts?: operationsOptions,
  ) => Promise<void>
  schedule: (releaseId: string, date: Date, opts?: operationsOptions) => Promise<void>
  //todo: reschedule: (releaseId: string, newDate: Date) => Promise<void>
  unschedule: (releaseId: string, opts?: operationsOptions) => Promise<void>
  archive: (releaseId: string, opts?: operationsOptions) => Promise<void>
  unarchive: (releaseId: string, opts?: operationsOptions) => Promise<void>
  updateRelease: (release: EditableReleaseDocument, opts?: operationsOptions) => Promise<void>
  createRelease: (release: EditableReleaseDocument, opts?: operationsOptions) => Promise<void>
  deleteRelease: (releaseId: string, opts?: operationsOptions) => Promise<void>
  revertRelease: (
    revertReleaseId: string,
    documents: RevertDocument[],
    releaseMetadata: ReleaseDocument['metadata'],
    revertType: 'staged' | 'immediate',
    opts?: operationsOptions,
  ) => Promise<void>
  createVersion: (
    releaseId: string,
    documentId: string,
    initialvalue?: Record<string, unknown>,
    opts?: operationsOptions,
  ) => Promise<void>
  discardVersion: (releaseId: string, documentId: string, opts?: operationsOptions) => Promise<void>
  unpublishVersion: (documentId: string, opts?: operationsOptions) => Promise<void>
}

const IS_CREATE_VERSION_ACTION_SUPPORTED = false
const METADATA_PROPERTY_NAME = 'metadata'

export function createReleaseOperationsStore(options: {
  client: SanityClient
  onReleaseLimitReached: (limit: number) => void
}): ReleaseOperationsStore {
  const {client} = options
  const requestAction = createRequestAction(options.onReleaseLimitReached)

  const handleCreateRelease = (release: EditableReleaseDocument, opts?: operationsOptions) =>
    requestAction(
      client,
      {
        actionType: 'sanity.action.release.create',
        releaseId: getReleaseIdFromReleaseDocumentId(release._id),
        [METADATA_PROPERTY_NAME]: release.metadata,
      },
      opts,
    )

  const handleUpdateRelease = async (
    release: EditableReleaseDocument,
    opts?: operationsOptions,
  ) => {
    const bundleId = getReleaseIdFromReleaseDocumentId(release._id)

    const unsetKeys = Object.entries(release)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => `${METADATA_PROPERTY_NAME}.${key}`)

    await requestAction(
      client,
      {
        actionType: 'sanity.action.release.edit',
        releaseId: bundleId,
        patch: {
          // todo: consider more granular updates here
          set: {[METADATA_PROPERTY_NAME]: release.metadata},
          unset: unsetKeys,
        },
      },
      opts,
    )
  }

  const handlePublishRelease = (
    releaseId: string,
    useUnstableAction?: boolean,
    opts?: operationsOptions,
  ) =>
    requestAction(
      client,
      [
        {
          actionType: useUnstableAction
            ? 'sanity.action.release.publish2'
            : 'sanity.action.release.publish',
          releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
        },
      ],
      opts,
    )

  const handleScheduleRelease = (releaseId: string, publishAt: Date, opts?: operationsOptions) =>
    requestAction(
      client,
      [
        {
          actionType: 'sanity.action.release.schedule',
          releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
          publishAt: publishAt.toISOString(),
        },
      ],
      opts,
    )

  const handleUnscheduleRelease = (releaseId: string, opts?: operationsOptions) =>
    requestAction(
      client,
      [
        {
          actionType: 'sanity.action.release.unschedule',
          releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
        },
      ],
      opts,
    )

  const handleArchiveRelease = (releaseId: string, opts?: operationsOptions) =>
    requestAction(
      client,
      [
        {
          actionType: 'sanity.action.release.archive',
          releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
        },
      ],
      opts,
    )

  const handleUnarchiveRelease = (releaseId: string, opts?: operationsOptions) =>
    requestAction(
      client,
      [
        {
          actionType: 'sanity.action.release.unarchive',
          releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
        },
      ],
      opts,
    )

  const handleDeleteRelease = (releaseId: string, opts?: operationsOptions) =>
    requestAction(
      client,
      [
        {
          actionType: 'sanity.action.release.delete',
          releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
        },
      ],
      opts,
    )

  const handleCreateVersion = async (
    releaseId: string,
    documentId: string,
    initialValue?: Record<string, unknown>,
    opts?: operationsOptions,
  ) => {
    // the documentId will show you where the document is coming from and which
    // document should it copy from

    // fetch original document
    const document = await client.getDocument(documentId)

    if (!document && !initialValue) {
      throw new Error(`Document with id ${documentId} not found and no initial value provided`)
    }

    const versionDocument = {
      ...(document || {}),
      ...(initialValue || {}),
      _id: getVersionId(documentId, releaseId),
    } as IdentifiedSanityDocumentStub

    await (IS_CREATE_VERSION_ACTION_SUPPORTED
      ? requestAction(
          client,
          [
            {
              actionType: 'sanity.action.document.createVersion',
              releaseId,
              attributes: versionDocument,
            },
          ],
          opts,
        )
      : client.create(versionDocument, opts))
  }

  const handleDiscardVersion = (releaseId: string, documentId: string, opts?: operationsOptions) =>
    requestAction(
      client,
      [
        {
          actionType: 'sanity.action.document.discard',
          draftId: getVersionId(documentId, releaseId),
        },
      ],
      opts,
    )

  const handleUnpublishVersion = (documentId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.document.version.unpublish',
        draftId: documentId,
        publishedId: getPublishedId(documentId),
      },
    ])

  const handleRevertRelease = async (
    revertReleaseId: string,
    releaseDocuments: RevertDocument[],
    releaseMetadata: ReleaseDocument['metadata'],
    revertType: 'staged' | 'immediate',
  ) => {
    await handleCreateRelease({
      _id: revertReleaseId,
      metadata: {
        title: releaseMetadata.title,
        description: releaseMetadata.description,
        releaseType: 'asap',
      },
    })
    await Promise.allSettled(
      releaseDocuments.map((document) =>
        handleCreateVersion(
          getReleaseIdFromReleaseDocumentId(revertReleaseId),
          document._id,
          document,
        ),
      ),
    )

    if (revertType === 'immediate') {
      await handlePublishRelease(revertReleaseId)
    }
  }

  return {
    archive: handleArchiveRelease,
    unarchive: handleUnarchiveRelease,
    schedule: handleScheduleRelease,
    unschedule: handleUnscheduleRelease,
    createRelease: handleCreateRelease,
    updateRelease: handleUpdateRelease,
    publishRelease: handlePublishRelease,
    deleteRelease: handleDeleteRelease,
    revertRelease: handleRevertRelease,
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
    unpublishVersion: handleUnpublishVersion,
  }
}

interface ScheduleApiAction {
  actionType: 'sanity.action.release.schedule'
  releaseId: string
  publishAt: string
  dryRun?: boolean
  skipCrossDatasetValidation?: boolean
}

interface PublishApiAction {
  actionType: 'sanity.action.release.publish' | 'sanity.action.release.publish2'
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

interface UnpublishVersionReleaseApiAction {
  actionType: 'sanity.action.document.version.unpublish'
  draftId: string
  publishedId: string
}

interface EditReleaseApiAction {
  actionType: 'sanity.action.release.edit'
  releaseId: string
  patch: EditAction['patch']
}

interface DeleteApiAction {
  actionType: 'sanity.action.release.delete'
  releaseId: string
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
  | DeleteApiAction
  | CreateVersionReleaseApiAction
  | UnpublishVersionReleaseApiAction

export function createRequestAction(onReleaseLimitReached: (limit: number) => void) {
  return async function requestAction(
    client: SanityClient,
    actions: ReleaseAction | ReleaseAction[],
    options?: operationsOptions,
  ): Promise<void> {
    const {dataset} = client.config()
    try {
      return await client.request({
        uri: `/data/actions/${dataset}`,
        method: 'POST',
        body: {
          ...options,
          actions: Array.isArray(actions) ? actions : [actions],
        },
      })
    } catch (e) {
      if (isReleaseLimitError(e)) {
        // free accounts do not return limit, 0 is implied
        onReleaseLimitReached(e.details.limit || 0)
      }

      throw e
    }
  }
}
