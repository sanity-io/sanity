/**
 * Fixture world for the Scheduled Drafts surfaces (`scheduledDrafts.enabled`).
 *
 * A scheduled draft is a single-document `scheduled` release: one version document
 * (`versions.<releaseId>.<publishedId>`) parked in a release whose `intendedPublishAt`
 * fires the publish. The Publish / Delete confirmation dialogs resolve that document
 * through the SAME release-bundle seam the variant detail table uses:
 *
 *   `useScheduledDraftDocument` → `useReleaseDocuments(releaseId)` →
 *   `getBundleDocumentsObservable({groqFilter: 'sanity::partOfRelease($releaseId)'})` →
 *   `documentPreviewStore.unstable_observeDocumentIdSet(filter, {releaseId})` for the
 *   membership id-set, then `unstable_observeDocument` + pair availability + real
 *   validation per id.
 *
 * {@link createScheduledDraftPreviewStore} wraps the shared mock preview store with ONE
 * override: the id-set observer answers `partOfRelease` filters from a membership map
 * keyed by the SHORT release id (the id `getReleaseIdFromReleaseDocumentId` parses out
 * of `_.releases.<id>`). Every downstream read — preview prepare, availability,
 * validation — is the real machinery against these fixture documents. The release
 * store itself is seeded separately via `WithStudioProviders({releases})`.
 *
 * The Delete dialog's copy-to-draft branch additionally reads the local draft through
 * `useDocumentVersions` → `unstable_observeVersionDocumentIds(publishedId)` (answered by
 * the base mock store from the seeded `drafts.` document): a draft whose revision differs
 * from the scheduled version's base revision surfaces the "copy changes to draft?"
 * checkbox.
 */
import {type ReleaseDocument} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {of} from 'rxjs'

import {type DocumentPreviewStore} from '../../../packages/sanity/src/core/preview/documentPreviewStore'
import {createMockPreviewUniverse} from './mockDocumentPreviewStore'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Two single-document `scheduled` releases:
 * - `rSchedDraft` — holds the "Q4 launch announcement" version document; drives the
 *   Publish dialog and the Delete dialog's copy-to-draft path.
 * - `rSchedEmpty` — no document in its bundle; drives the Delete dialog's
 *   already-current path (nothing to copy, straight delete).
 *
 * Ids follow the `_.releases.<releaseId>` convention. `intendedPublishAt` is in the
 * future so the release reads as an upcoming scheduled publish.
 */
export const scheduledDraftReleases: ReleaseDocument[] = [
  {
    _id: '_.releases.rSchedDraft',
    name: 'rSchedDraft',
    _type: 'system.release',
    _rev: 'rev-sched-draft-1',
    _createdAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
    _updatedAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
    state: 'scheduled',
    publishAt: new Date(Date.now() + 3 * DAY_MS).toISOString(),
    metadata: {
      title: 'Scheduled draft',
      releaseType: 'scheduled',
      intendedPublishAt: new Date(Date.now() + 3 * DAY_MS).toISOString(),
    },
  },
  {
    _id: '_.releases.rSchedEmpty',
    name: 'rSchedEmpty',
    _type: 'system.release',
    _rev: 'rev-sched-empty-1',
    _createdAt: new Date(Date.now() - 4 * DAY_MS).toISOString(),
    _updatedAt: new Date(Date.now() - 4 * DAY_MS).toISOString(),
    state: 'scheduled',
    publishAt: new Date(Date.now() + 5 * DAY_MS).toISOString(),
    metadata: {
      title: 'Scheduled draft',
      releaseType: 'scheduled',
      intendedPublishAt: new Date(Date.now() + 5 * DAY_MS).toISOString(),
    },
  },
]

/**
 * The scheduled version document (what the dialog previews) plus its local draft and
 * published base. The draft's `_rev` differs from the version — so the Delete dialog's
 * "changes differ" branch surfaces the copy-to-draft checkbox.
 */
export const scheduledDraftDocuments: SanityDocument[] = [
  {
    _id: 'versions.rSchedDraft.book-launch',
    _type: 'book',
    _rev: 'rev-launch-version-1',
    _createdAt: '2026-07-10T09:00:00Z',
    _updatedAt: '2026-07-20T14:00:00Z',
    title: 'Q4 launch announcement',
    year: 2026,
  },
  {
    _id: 'drafts.book-launch',
    _type: 'book',
    _rev: 'rev-launch-draft-9',
    _createdAt: '2026-07-10T09:00:00Z',
    _updatedAt: '2026-07-18T08:00:00Z',
    title: 'Q4 launch announcement (local edits)',
    year: 2026,
  },
  {
    _id: 'book-launch',
    _type: 'book',
    _rev: 'rev-launch-published-1',
    _createdAt: '2026-06-01T09:00:00Z',
    _updatedAt: '2026-06-01T09:00:00Z',
    title: 'Q4 launch announcement',
    year: 2026,
  },
]

/**
 * Which documents belong to which release bundle, keyed by the SHORT release id
 * (`sanity::partOfRelease($releaseId)` receives the id without the `_.releases.`
 * prefix). `rSchedEmpty` maps to an empty set.
 */
export const scheduledDraftMembership: Record<string, string[]> = {
  rSchedDraft: ['versions.rSchedDraft.book-launch'],
  rSchedEmpty: [],
}

export interface ScheduledDraftPreviewStoreOptions {
  /** Fixture documents, keyed by `_id` (see `createMockPreviewUniverse`). */
  documents: SanityDocument[]
  /** Release-bundle membership per SHORT release id. */
  membership: Record<string, string[]>
}

/**
 * The shared mock preview store with ONE override: the id-set observer answers
 * `sanity::partOfRelease($releaseId)` filters from the membership map — exactly the
 * seam `useReleaseDocuments`/`useBundleDocuments` resolve a release's documents through.
 */
export function createScheduledDraftPreviewStore(
  options: ScheduledDraftPreviewStoreOptions,
): DocumentPreviewStore {
  const inner = createMockPreviewUniverse({documents: options.documents}).store

  return {
    ...inner,
    unstable_observeDocumentIdSet: (queryFilter, params, observeOptions) => {
      if (queryFilter.includes('partOfRelease')) {
        const releaseId = typeof params?.releaseId === 'string' ? params.releaseId : ''
        return of({
          status: 'connected' as const,
          documentIds: options.membership[releaseId] ?? [],
        })
      }
      return inner.unstable_observeDocumentIdSet(queryFilter, params, observeOptions)
    },
  }
}
