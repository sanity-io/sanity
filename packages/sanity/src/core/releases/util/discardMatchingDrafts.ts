import {type ReleaseDocument, type SanityClient} from '@sanity/client'

import {getDraftId, getPublishedId} from '../../util'
import {getReleaseIdFromReleaseDocumentId} from './getReleaseIdFromReleaseDocumentId'

const SYSTEM_FIELDS = ['_id', '_rev', '_updatedAt', '_createdAt']

/**
 * Compares two documents for content equality, ignoring system fields
 * that are expected to differ between draft and published versions.
 *
 * @internal
 */
export function documentsContentMatch(
  draftDoc: Record<string, unknown>,
  publishedDoc: Record<string, unknown>,
): boolean {
  const draftEntries = Object.entries(draftDoc).filter(([key]) => !SYSTEM_FIELDS.includes(key))
  const publishedEntries = Object.entries(publishedDoc).filter(
    ([key]) => !SYSTEM_FIELDS.includes(key),
  )

  if (draftEntries.length !== publishedEntries.length) return false

  try {
    const normalize = (entries: [string, unknown][]) =>
      JSON.stringify(entries.sort(([a], [b]) => a.localeCompare(b)))
    return normalize(draftEntries) === normalize(publishedEntries)
  } catch {
    return false
  }
}

/**
 * Discards drafts that match their published counterparts for a given set of published IDs.
 * This prevents stale drafts from persisting after a release publish.
 *
 * @internal
 */
export async function discardMatchingDrafts(
  client: SanityClient,
  publishedIds: string[],
): Promise<void> {
  if (!publishedIds.length) return

  const draftIdsToDelete: string[] = []
  await Promise.all(
    publishedIds.map(async (publishedId) => {
      const draftId = getDraftId(publishedId)
      const [draftDoc, publishedDoc] = await Promise.all([
        client.getDocument(draftId),
        client.getDocument(publishedId),
      ])

      if (draftDoc && publishedDoc && documentsContentMatch(draftDoc, publishedDoc)) {
        draftIdsToDelete.push(draftId)
      }
    }),
  )

  if (draftIdsToDelete.length > 0) {
    const tx = client.transaction()
    for (const draftId of draftIdsToDelete) {
      tx.delete(draftId)
    }
    await tx.commit({tag: 'release.post-publish-draft-cleanup'})
  }
}

/**
 * After a release is published, discard any drafts that match the published version.
 * Uses `finalDocumentStates` if available (for already-published releases),
 * otherwise queries for documents still in the release.
 *
 * @internal
 */
export async function discardMatchingDraftsForRelease(
  client: SanityClient,
  release: ReleaseDocument,
): Promise<void> {
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  let publishedIds: string[]
  if (release.finalDocumentStates?.length) {
    publishedIds = release.finalDocumentStates.map((doc) => doc.id)
  } else {
    const versionIds = await client.fetch<string[]>(
      `*[sanity::partOfRelease($releaseId)]._id`,
      {releaseId},
      {tag: 'release.post-publish-draft-cleanup'},
    )
    publishedIds = [...new Set((versionIds || []).map((id) => getPublishedId(id)))]
  }

  await discardMatchingDrafts(client, publishedIds)
}
