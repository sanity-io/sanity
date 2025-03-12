import {
  type IdentifiedSanityDocumentStub,
  type ReleaseAction,
  type SanityClient,
  type SingleActionResult,
  type VersionAction,
} from '@sanity/client'

import {getPublishedId, getVersionId} from '../../util'
import {type ReleasesUpsellContextValue} from '../contexts/upsell/types'
import {getReleaseIdFromReleaseDocumentId, type ReleaseDocument} from '../index'
import {type RevertDocument} from '../tool/components/releaseCTAButtons/ReleaseRevertButton/useDocumentRevertStates'
import {prepareVersionReferences} from '../util/prepareVersionReferences'
import {isReleaseLimitError} from './isReleaseLimitError'
import {type EditableReleaseDocument} from './types'

interface operationsOptions {
  dryRun?: boolean
  skipCrossDatasetValidation?: boolean
}
export interface ReleaseOperationsStore {
  publishRelease: (releaseId: string, opts?: operationsOptions) => Promise<SingleActionResult>
  schedule: (releaseId: string, date: Date, opts?: operationsOptions) => Promise<SingleActionResult>
  //todo: reschedule: (releaseId: string, newDate: Date) => Promise<void>
  unschedule: (releaseId: string, opts?: operationsOptions) => Promise<SingleActionResult>
  archive: (releaseId: string, opts?: operationsOptions) => Promise<SingleActionResult>
  unarchive: (releaseId: string, opts?: operationsOptions) => Promise<SingleActionResult>
  updateRelease: (
    release: EditableReleaseDocument,
    opts?: operationsOptions,
  ) => Promise<SingleActionResult>
  createRelease: (
    release: EditableReleaseDocument,
    opts?: operationsOptions,
  ) => Promise<SingleActionResult>
  deleteRelease: (releaseId: string, opts?: operationsOptions) => Promise<SingleActionResult>
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
  ) => Promise<SingleActionResult>
  discardVersion: (releaseId: string, documentId: string, opts?: operationsOptions) => Promise<void>
  unpublishVersion: (documentId: string, opts?: operationsOptions) => Promise<void>
}

export function createReleaseOperationsStore(options: {
  client: SanityClient
  onReleaseLimitReached: ReleasesUpsellContextValue['onReleaseLimitReached']
}): ReleaseOperationsStore {
  const {client} = options
  const requestAction = createRequestAction(options.onReleaseLimitReached)

  const handleCreateRelease = (release: EditableReleaseDocument, opts?: operationsOptions) =>
    client.releases.create(getReleaseIdFromReleaseDocumentId(release._id), release.metadata, opts)

  const handleUpdateRelease = async (
    release: EditableReleaseDocument,
    opts?: operationsOptions,
  ) => {
    const bundleId = getReleaseIdFromReleaseDocumentId(release._id)

    const unsetKeys = Object.entries(release)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => `metadata.${key}`)

    await client.releases.edit(
      bundleId,
      {
        set: {metadata: release.metadata},
        unset: unsetKeys,
      },
      opts,
    )
  }

  const handlePublishRelease = (releaseId: string, opts?: operationsOptions) =>
    client.releases.publish(getReleaseIdFromReleaseDocumentId(releaseId), opts)

  const handleScheduleRelease = (releaseId: string, publishAt: Date, opts?: operationsOptions) =>
    client.releases.schedule(
      getReleaseIdFromReleaseDocumentId(releaseId),
      publishAt.toISOString(),
      opts,
    )

  const handleUnscheduleRelease = (releaseId: string, opts?: operationsOptions) =>
    client.releases.unschedule(getReleaseIdFromReleaseDocumentId(releaseId), opts)

  const handleArchiveRelease = (releaseId: string, opts?: operationsOptions) =>
    client.releases.archive(getReleaseIdFromReleaseDocumentId(releaseId), opts)

  const handleUnarchiveRelease = (releaseId: string, opts?: operationsOptions) =>
    client.releases.unarchive(getReleaseIdFromReleaseDocumentId(releaseId), opts)

  const handleDeleteRelease = (releaseId: string, opts?: operationsOptions) =>
    client.releases.delete(getReleaseIdFromReleaseDocumentId(releaseId), opts)

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

    const versionDocument = prepareVersionReferences({
      ...(document || {}),
      ...(initialValue || {}),
      _id: getVersionId(documentId, releaseId),
    }) as IdentifiedSanityDocumentStub

    await client.createVersion(versionDocument, getPublishedId(documentId), opts)
  }

  const handleDiscardVersion = (releaseId: string, documentId: string, opts?: operationsOptions) =>
    requestAction(
      client,
      [
        {
          actionType: 'sanity.action.document.version.discard',
          versionId: getVersionId(documentId, releaseId),
        },
      ],
      opts,
    )

  const handleUnpublishVersion = (documentId: string) =>
    requestAction(client, [
      {
        actionType: 'sanity.action.document.version.unpublish',
        versionId: documentId,
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

type ReleaseStoreAction = ReleaseAction | VersionAction

export function createRequestAction(
  onReleaseLimitReached: ReleasesUpsellContextValue['onReleaseLimitReached'],
) {
  return async function requestAction(
    client: SanityClient,
    actions: ReleaseStoreAction | ReleaseStoreAction[],
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
      // if dryRunning then essentially this is a silent request
      // so don't want to create disruptive upsell because of limit
      if (!options?.dryRun && isReleaseLimitError(e)) {
        // free accounts do not return limit, 0 is implied
        onReleaseLimitReached(e.details.limit || 0)
      }

      throw e
    }
  }
}
