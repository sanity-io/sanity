import {
  type BaseActionOptions,
  type IdentifiedSanityDocumentStub,
  type SanityClient,
  type SingleActionResult,
} from '@sanity/client'

import {getPublishedId, getVersionFromId, getVersionId} from '../../util'
import {type ReleasesUpsellContextValue} from '../contexts/upsell/types'
import {getReleaseIdFromReleaseDocumentId, type ReleaseDocument} from '../index'
import {type RevertDocument} from '../tool/components/releaseCTAButtons/ReleaseRevertButton/useDocumentRevertStates'
import {prepareVersionReferences} from '../util/prepareVersionReferences'
import {isReleaseLimitError} from './isReleaseLimitError'
import {type EditableReleaseDocument} from './types'

export interface ReleaseOperationsStore {
  publishRelease: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  schedule: (releaseId: string, date: Date, opts?: BaseActionOptions) => Promise<SingleActionResult>
  unschedule: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  archive: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  unarchive: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  updateRelease: (release: EditableReleaseDocument, opts?: BaseActionOptions) => Promise<void>
  createRelease: (
    release: EditableReleaseDocument,
    opts?: BaseActionOptions,
  ) => Promise<SingleActionResult>
  deleteRelease: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  revertRelease: (
    revertReleaseId: string,
    documents: RevertDocument[],
    releaseMetadata: ReleaseDocument['metadata'],
    revertType: 'staged' | 'immediate',
  ) => Promise<void>
  createVersion: (
    releaseId: string,
    documentId: string,
    initialvalue?: Record<string, unknown>,
    opts?: BaseActionOptions,
  ) => Promise<void>
  discardVersion: (
    releaseId: string,
    documentId: string,
    opts?: BaseActionOptions,
  ) => Promise<SingleActionResult>
  unpublishVersion: (documentId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
}

export function createReleaseOperationsStore(options: {
  client: SanityClient
  onReleaseLimitReached: ReleasesUpsellContextValue['onReleaseLimitReached']
}): ReleaseOperationsStore {
  const {client, onReleaseLimitReached} = options

  const handleReleaseLimitError = (
    action: Promise<SingleActionResult>,
    opts?: {dryRun?: boolean},
  ) =>
    action.catch((error) => {
      // if dryRunning then essentially this is a silent request
      // so don't want to create disruptive upsell because of limit
      if (!opts?.dryRun && isReleaseLimitError(error)) {
        // free accounts do not return limit, 0 is implied
        onReleaseLimitReached(error.details.limit || 0)
      }

      throw error
    })

  const handleCreateRelease = (release: EditableReleaseDocument, opts?: BaseActionOptions) =>
    handleReleaseLimitError(
      client.releases.create(
        {releaseId: getReleaseIdFromReleaseDocumentId(release._id), metadata: release.metadata},
        opts,
      ),
      opts,
    )

  const handleUpdateRelease = async (
    release: EditableReleaseDocument,
    opts?: BaseActionOptions,
  ) => {
    const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

    const unsetKeys = Object.entries(release)
      .filter(([_, value]) => value === undefined)
      .map(([key]) => `metadata.${key}`)

    await handleReleaseLimitError(
      client.releases.edit(
        {
          releaseId,
          patch: {
            set: {metadata: release.metadata},
            unset: unsetKeys,
          },
        },
        opts,
      ),
      opts,
    )
  }

  const handlePublishRelease = (releaseId: string, opts?: BaseActionOptions) =>
    handleReleaseLimitError(
      client.releases.publish({releaseId: getReleaseIdFromReleaseDocumentId(releaseId)}, opts),
      opts,
    )

  const handleScheduleRelease = (releaseId: string, publishAt: Date, opts?: BaseActionOptions) =>
    handleReleaseLimitError(
      client.releases.schedule(
        {
          releaseId: getReleaseIdFromReleaseDocumentId(releaseId),
          publishAt: publishAt.toISOString(),
        },
        opts,
      ),
      opts,
    )

  const handleUnscheduleRelease = (releaseId: string, opts?: BaseActionOptions) =>
    handleReleaseLimitError(
      client.releases.unschedule({releaseId: getReleaseIdFromReleaseDocumentId(releaseId)}, opts),
      opts,
    )

  const handleArchiveRelease = (releaseId: string, opts?: BaseActionOptions) =>
    client.releases.archive({releaseId: getReleaseIdFromReleaseDocumentId(releaseId)}, opts)

  const handleUnarchiveRelease = (releaseId: string, opts?: BaseActionOptions) =>
    handleReleaseLimitError(
      client.releases.unarchive({releaseId: getReleaseIdFromReleaseDocumentId(releaseId)}, opts),
      opts,
    )

  const handleDeleteRelease = (releaseId: string, opts?: BaseActionOptions) =>
    client.releases.delete({releaseId: getReleaseIdFromReleaseDocumentId(releaseId)}, opts)

  const handleCreateVersion = async (
    releaseId: string,
    documentId: string,
    initialValue?: Record<string, unknown>,
    opts?: BaseActionOptions,
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

    await client.createVersion(
      {document: versionDocument, publishedId: getPublishedId(documentId), releaseId},
      opts,
    )
  }

  const handleDiscardVersion = (releaseId: string, documentId: string, opts?: BaseActionOptions) =>
    client.discardVersion({releaseId, publishedId: getPublishedId(documentId)}, false, opts)

  const handleUnpublishVersion = (documentId: string, opts?: BaseActionOptions) => {
    const releaseId = getVersionFromId(documentId)
    // in cases where the document is not part of a release, or document is `drafts.`
    // the releaseId will be undefined
    // cannot unpublish in this case
    if (!releaseId) {
      throw new Error(`Release ID not found for document ${documentId}`)
    }

    return client.unpublishVersion({releaseId, publishedId: getPublishedId(documentId)}, opts)
  }

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
