import {
  type BaseActionOptions,
  type CreateVersionAction,
  type EditableReleaseDocument,
  type IdentifiedSanityDocumentStub,
  type ReleaseDocument,
  type SanityClient,
  type SingleActionResult,
} from '@sanity/client'

import {getPublishedId, getVersionFromId, getVersionId} from '../../util/draftUtils'
import {type ReleasesUpsellContextValue} from '../contexts/upsell/types'
import {type RevertDocument} from '../tool/components/releaseCTAButtons/ReleaseRevertButton/useDocumentRevertStates'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {isReleaseLimitError} from './isReleaseLimitError'

export interface ReleaseOperationsStore {
  publishRelease: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  schedule: (releaseId: string, date: Date, opts?: BaseActionOptions) => Promise<SingleActionResult>
  unschedule: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  archive: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  unarchive: (releaseId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  updateRelease: (
    release: EditableReleaseDocument,
    opts?: BaseActionOptions,
  ) => Promise<SingleActionResult>
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
  duplicateRelease: (
    releaseDocumentId: string,
    releaseMetadata: ReleaseDocument['metadata'],
    releaseDocuments?: IdentifiedSanityDocumentStub[],
  ) => Promise<void>
  createVersion: (
    releaseId: string,
    documentId: string,
    initialValue?: Omit<EditableReleaseDocument, '_id' | '_type'>,
    opts?: BaseActionOptions,
  ) => Promise<SingleActionResult>
  discardVersion: (
    releaseId: string,
    documentId: string,
    opts?: BaseActionOptions,
  ) => Promise<SingleActionResult>
  unpublishVersion: (documentId: string, opts?: BaseActionOptions) => Promise<SingleActionResult>
  revertUnpublishVersion: (
    documentId: string,
    opts?: BaseActionOptions,
  ) => Promise<SingleActionResult>
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

    return handleReleaseLimitError(
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
    opts?: BaseActionOptions,
  ) => {
    // fetch original document to get the revision id
    const document = await client.getDocument(documentId)

    if (!document) {
      throw new Error(`Document with id ${documentId} not found and no initial value provided`)
    }

    return client.createVersion(
      {
        baseId: documentId,
        ifBaseRevisionId: document?._rev,
        publishedId: getPublishedId(documentId),
        releaseId,
      },
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
    const versionId = getReleaseIdFromReleaseDocumentId(revertReleaseId)
    const newVersionDocumentActions: CreateVersionAction[] = releaseDocuments.map(
      (releaseDocument) => ({
        actionType: 'sanity.action.document.version.create',
        document: {...releaseDocument, _id: getVersionId(releaseDocument._id, versionId)},
        publishedId: getPublishedId(releaseDocument._id),
      }),
    )
    await client.action(newVersionDocumentActions)

    if (revertType === 'immediate') {
      await handlePublishRelease(revertReleaseId)
    }
  }

  const handleDuplicateRelease = async (
    releaseDocumentId: string,
    releaseMetadata: ReleaseDocument['metadata'],
    releaseDocuments?: IdentifiedSanityDocumentStub[],
  ) => {
    await handleCreateRelease({
      _id: releaseDocumentId,
      metadata: releaseMetadata,
    })

    if (releaseDocuments) {
      const versionId = getReleaseIdFromReleaseDocumentId(releaseDocumentId)
      const duplicateVersionDocumentActions: CreateVersionAction[] = releaseDocuments.map(
        (releaseDocument) => ({
          actionType: 'sanity.action.document.version.create',
          document: {...releaseDocument, _id: getVersionId(releaseDocument._id, versionId)},
          publishedId: getPublishedId(releaseDocument._id),
        }),
      )
      await client.action(duplicateVersionDocumentActions)
    }
  }

  const handleRevertUnpublishVersion = async (documentId: string, opts?: BaseActionOptions) => {
    return await client.action(
      {
        actionType: 'sanity.action.document.edit',
        draftId: documentId,
        publishedId: getPublishedId(documentId),
        patch: {
          unset: ['_system.delete'],
        },
      },
      opts,
    )
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
    duplicateRelease: handleDuplicateRelease,
    createVersion: handleCreateVersion,
    discardVersion: handleDiscardVersion,
    unpublishVersion: handleUnpublishVersion,
    revertUnpublishVersion: handleRevertUnpublishVersion,
  }
}
