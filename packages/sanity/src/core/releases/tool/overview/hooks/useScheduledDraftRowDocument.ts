import {type ReleaseDocument, type SanityDocument} from '@sanity/client'
import {type ValidationMarker} from '@sanity/types'

import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'

/**
 * Why a row of the scheduled drafts table has no document to show once nothing is loading.
 *
 * - `no-document`: the scheduled draft has no document.
 * - `history-removed`: a published or archived scheduled draft reads its document from history,
 *   which answers without a revision once the dataset's history retention has removed it.
 * - `error`: the document could not be read.
 *
 * `documentId` is the id of the document the scheduled draft was for, when the release records it.
 *
 * @internal
 */
export type ScheduledDraftMissingDocument =
  | {reason: 'no-document'}
  | {reason: 'history-removed'; documentId: string}
  | {reason: 'error'; documentId: string | undefined}

function getMissingDocument(
  release: ReleaseDocument & {isLoading?: boolean},
  {
    firstDocument,
    loading,
    error,
  }: {firstDocument: SanityDocument | undefined; loading: boolean; error: Error | null},
): ScheduledDraftMissingDocument | null {
  if (release.isLoading || loading || firstDocument) return null

  const documentId = release.finalDocumentStates?.[0]?.id
  if (error) return {reason: 'error', documentId}
  if (!documentId) return {reason: 'no-document'}
  if (release.state === 'published' || release.state === 'archived') {
    return {reason: 'history-removed', documentId}
  }
  return {reason: 'no-document'}
}

/**
 * The document of a row of the scheduled drafts table, and why there is none once it has loaded.
 *
 * @internal
 */
export function useScheduledDraftRowDocument(release: ReleaseDocument & {isLoading?: boolean}): {
  firstDocument: SanityDocument | undefined
  firstDocumentValidation: ValidationMarker[] | undefined
  loading: boolean
  missingDocument: ScheduledDraftMissingDocument | null
} {
  const {firstDocument, firstDocumentValidation, loading, error} = useScheduledDraftDocument(
    release._id && !release.isLoading ? release._id : undefined,
  )

  return {
    firstDocument,
    firstDocumentValidation,
    loading,
    missingDocument: getMissingDocument(release, {firstDocument, loading, error}),
  }
}
