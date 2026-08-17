import {type ReleaseState} from '@sanity/client'

import {getPublishedId} from '../../../util/draftUtils'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

const isArchivedRelease = (releaseState: ReleaseState | undefined) =>
  releaseState === 'archived' || releaseState === 'archiving' || releaseState === 'unarchiving'

interface ReleaseDocumentIntentOptions {
  documentId: string
  documentTypeName: string
  releaseId: string
  releaseState?: ReleaseState
  documentRevision?: string
  isCardinalityOneRelease?: boolean
  /** Short variant id for the sticky `variant` search param. */
  variantId?: string
  /** Optional field path (stringified) to focus when the document opens. */
  path?: string
}

/**
 * Builds the `edit` intent params and search params used to open a document version
 * within a release perspective. Shared so that both the document preview link and the
 * validation deep-link resolve to the exact same document/perspective.
 *
 * @internal
 */
export function getReleaseDocumentIntent({
  documentId,
  documentTypeName,
  releaseId,
  releaseState,
  documentRevision,
  isCardinalityOneRelease,
  variantId,
  path,
}: ReleaseDocumentIntentOptions): {
  params: Record<string, string | undefined>
  searchParams: [string, string][] | undefined
} {
  const releaseName = getReleaseIdFromReleaseDocumentId(releaseId)

  let intentParams: Record<string, string | undefined> = {}
  if (isCardinalityOneRelease) {
    intentParams = {scheduledDraft: releaseName}
  } else if (releaseState === 'published') {
    // We are inspecting this document through the published view of the doc.
    intentParams = {
      rev: `@release:${releaseName}`,
      inspect: 'sanity/structure/history',
    }
  } else if (releaseState === 'archived') {
    // We are "faking" the release as if it is still valid only to render the document
    intentParams = {
      rev: '@lastEdited',
      inspect: 'sanity/structure/history',
      historyEvent: documentRevision,
      historyVersion: releaseName,
      archivedRelease: 'true',
    }
  }

  const searchParams: [string, string][] | undefined =
    isCardinalityOneRelease || isArchivedRelease(releaseState)
      ? undefined
      : [
          ...(variantId ? [['variant', variantId] as [string, string]] : []),
          ['perspective', releaseState === 'published' ? 'published' : releaseName],
        ]

  return {
    params: {
      id: getPublishedId(documentId),
      type: documentTypeName,
      ...intentParams,
      ...(path ? {path} : {}),
    },
    searchParams,
  }
}
