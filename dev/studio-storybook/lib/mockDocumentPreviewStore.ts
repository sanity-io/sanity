/**
 * A hand-implemented `DocumentPreviewStore` backed by an in-memory fixture map.
 *
 * Why not fake GROQ responses on the mock client instead? The real store funnels every
 * read through a global listener + batched field observers keyed off live queries —
 * intercepting at that layer is brittle and known to be a dead end. The store interface
 * itself is the stable seam: `useDocumentPreviewStore()` resolves the store from the
 * resource cache (`packages/sanity/src/core/store/datastores.ts`), so a story harness
 * can seed the cache with this implementation and every consumer downstream —
 * `getReferenceInfo` (client adapter), `getPreviewStateObservable`, `useDocumentVersions`,
 * `PreviewLoader` — runs its real logic against fixture documents.
 *
 * Methods exercised by the ReferenceInput render path (all real):
 * - `unstable_observeDocumentStackAvailability` — availability resolution in the adapter
 * - `observeDocumentTypeFromId` — `_type` lookup for the referenced document
 * - `observePaths` — `_rev` existence probe (publish status) + version stubs + previews
 * - `observeForPreview` — delegated to the REAL `createPreviewObserver`, so the actual
 *   `prepareForPreview` select/prepare pipeline runs against the fixtures
 * - `unstable_observeVersionDocumentIds` — feeds `useDocumentVersions` → status dots
 */
import {type SanityDocument} from '@sanity/types'
import {type Observable, of} from 'rxjs'
import {delay} from 'rxjs/operators'

import {createPreviewObserver} from '../../../packages/sanity/src/core/preview/createPreviewObserver'
import {
  type DocumentPreviewStore,
  type ObservePathsFn,
} from '../../../packages/sanity/src/core/preview/documentPreviewStore'
import {
  type DocumentAvailability,
  type DocumentStackAvailability,
} from '../../../packages/sanity/src/core/preview/types'
import {getDraftId, getPublishedId} from '../../../packages/sanity/src/core/util/draftUtils'

const READABLE: DocumentAvailability = {available: true, reason: 'READABLE'}
const NOT_FOUND: DocumentAvailability = {available: false, reason: 'NOT_FOUND'}

export interface MockDocumentPreviewStoreOptions {
  /** Fixture documents, keyed by their `_id` (include `drafts.`-prefixed ids for drafts). */
  documents: SanityDocument[]
  /** Optional artificial latency per emission, to make loading states visible. */
  delayMs?: number
  /**
   * Resolve the document id set for a GROQ filter, for surfaces that ask the preview store
   * "which documents match this?" rather than fetching them.
   *
   * `useBundleDocuments` - and therefore `ReleaseDetail`, `ReleaseSummary` and the release
   * document table - goes through `unstable_observeDocumentIdSet`, NOT through a client fetch.
   * That is why those components looked query-blocked when they are not: the mock simply
   * answered "no documents" to every filter.
   *
   * The mock does not evaluate GROQ (that is `lib/mockContentLake.ts`'s job, and it needs a
   * different input shape). Instead a story supplies the answer for the filters it exercises,
   * keyed by the `params` the caller passes - e.g. `({releaseId}) => idsInRelease[releaseId]`.
   * Returning ids the fixture documents do not contain is the honest way to story a partially
   * resolved set.
   */
  resolveDocumentIdSet?: (
    groqFilter: string,
    params: Record<string, unknown>,
  ) => string[] | undefined
}

export interface MockPreviewUniverse {
  store: DocumentPreviewStore
  /** Add or replace a fixture document (visible to subscriptions created afterwards). */
  upsert: (doc: SanityDocument) => void
  /** Delete a fixture document — e.g. to simulate a discarded draft. */
  remove: (id: string) => void
}

export function createMockDocumentPreviewStore(
  options: MockDocumentPreviewStoreOptions,
): DocumentPreviewStore {
  return createMockPreviewUniverse(options).store
}

/**
 * Like {@link createMockDocumentPreviewStore} but returns a mutation handle alongside
 * the store. The observables are cold and re-created per subscription, so documents
 * upserted/removed are reflected the next time a consumer (re)subscribes — there is no
 * live listener in the mock, so stories that mutate mid-flight should remount the
 * consuming subtree (bump a `key`) to force a re-read.
 */
export function createMockPreviewUniverse({
  documents,
  delayMs = 0,
  resolveDocumentIdSet,
}: MockDocumentPreviewStoreOptions): MockPreviewUniverse {
  const byId = new Map(documents.map((doc) => [doc._id, doc]))

  function emit<T>(value: T): Observable<T> {
    return delayMs > 0 ? of(value).pipe(delay(delayMs)) : of(value)
  }

  /**
   * Resolve a document the way a perspective stack would: walk the stack in order
   * (drafts → draft id, published → published id, release id → version id), falling
   * through to the published document — the `drafts` perspective overlays drafts on
   * published, it does not hide published-only documents.
   */
  function resolveDoc(id: string, perspective?: string[]): SanityDocument | undefined {
    if (!perspective || perspective.length === 0) {
      return byId.get(id)
    }
    const publishedId = getPublishedId(id)
    for (const name of perspective) {
      const candidateId =
        name === 'published'
          ? publishedId
          : name === 'drafts'
            ? getDraftId(publishedId)
            : `versions.${name}.${publishedId}`
      const doc = byId.get(candidateId)
      if (doc) return doc
    }
    return byId.get(publishedId)
  }

  /** Exact id first, then the draft/published sibling — for callers passing a bare pair id. */
  function resolvePairDoc(id: string): SanityDocument | undefined {
    const publishedId = getPublishedId(id)
    return byId.get(id) ?? byId.get(getDraftId(publishedId)) ?? byId.get(publishedId)
  }

  function availabilityOf(id: string): DocumentAvailability {
    return byId.has(id) ? READABLE : NOT_FOUND
  }

  // Whole-document superset: the real observePaths projects only the requested paths,
  // but every consumer in the story render path reads plain fields off the result, so
  // returning the full fixture document is a faithful superset.
  const observePaths: ObservePathsFn = (value, _paths, _apiConfig, perspective) => {
    const id =
      typeof value === 'string'
        ? value
        : ((value as {_id?: string; _ref?: string})._id ??
          (value as {_id?: string; _ref?: string})._ref)
    if (!id) {
      // Inline values (e.g. array items of object type) carry no _id/_ref; the real
      // path observer resolves their paths locally without fetching — mirror that by
      // handing back the value itself (whole-value superset again).
      return emit(typeof value === 'object' && value !== null ? (value as never) : null)
    }
    const doc = perspective ? resolveDoc(id, perspective) : byId.get(id)
    return emit(doc ?? null)
  }

  const observeDocumentTypeFromId: DocumentPreviewStore['observeDocumentTypeFromId'] = (
    id,
    _apiConfig,
    perspective,
  ) => {
    const doc = perspective ? resolveDoc(id, perspective) : resolvePairDoc(id)
    return emit(doc?._type)
  }

  // The real prepare pipeline (`prepareForPreview`, custom `prepare()`, list options)
  // running against fixture reads — not a re-implementation.
  const observeForPreview = createPreviewObserver({observeDocumentTypeFromId, observePaths})

  const store: DocumentPreviewStore = {
    observePaths,
    observeForPreview,
    observeDocumentTypeFromId,
    observeDocumentSystemFromId: () => emit(undefined),

    unstable_observeDocumentPairAvailability: (id) => {
      const publishedId = getPublishedId(id)
      return emit({
        draft: availabilityOf(getDraftId(publishedId)),
        published: availabilityOf(publishedId),
      })
    },

    unstable_observeDocumentStackAvailability: (id, perspectiveStack) => {
      const publishedId = getPublishedId(id)
      const candidateIds = perspectiveStack.map((name) =>
        name === 'published'
          ? publishedId
          : name === 'drafts'
            ? getDraftId(publishedId)
            : `versions.${name}.${publishedId}`,
      )
      if (!candidateIds.includes(publishedId)) {
        candidateIds.push(publishedId)
      }
      const stack: DocumentStackAvailability[] = candidateIds.map((candidateId) => ({
        id: candidateId,
        availability: availabilityOf(candidateId),
      }))
      return emit(stack)
    },

    unstable_observePathsDocumentPair: (id) => {
      const publishedId = getPublishedId(id)
      const draftId = getDraftId(publishedId)
      const doc = resolvePairDoc(id)
      return emit({
        id: publishedId,
        type: doc?._type ?? null,
        draft: {
          availability: availabilityOf(draftId),
          snapshot: byId.get(draftId) as never,
        },
        published: {
          availability: availabilityOf(publishedId),
          snapshot: byId.get(publishedId) as never,
        },
      })
    },

    // The mock does not evaluate GROQ. A story that needs this - anything reaching
    // `useBundleDocuments`, i.e. the release detail screen and its document table - supplies
    // `resolveDocumentIdSet`. Without one the set is empty and connected, which is a legitimate
    // state (a release with nothing in it) rather than a failure.
    unstable_observeDocumentIdSet: (groqFilter, params) =>
      emit({
        status: 'connected' as const,
        documentIds:
          resolveDocumentIdSet?.(groqFilter, (params ?? {}) as Record<string, unknown>) ?? [],
      }),

    unstable_observeVersionDocumentIds: (publishedId) => {
      const ids = [getDraftId(publishedId), publishedId].filter((id) => byId.has(id))
      return emit(ids)
    },

    unstable_observeDocument: (id) => emit(byId.get(id)),
    unstable_observeDocuments: (ids) => emit(ids.map((id) => byId.get(id))),
  }

  return {
    store,
    upsert: (doc) => {
      byId.set(doc._id, doc)
    },
    remove: (id) => {
      byId.delete(id)
    },
  }
}

/**
 * The shared author/book fixture universe for form-input stories.
 *
 * - `author-austen` — published only (strong ref resolves, no draft dot)
 * - `author-tolstoy` — draft + published (edited state: both status dots)
 * - `drafts.author-lem` — draft only (weak/strengthen-on-publish scenarios)
 * - `author-bronte`, `author-woolf` — extra authors so search result lists have depth
 * - `drafts.book-anna-karenina` — the host document being edited in the stories
 *
 * `author-missing` is intentionally absent — reference it to exercise the
 * nonexistent-target path.
 */
export const fixtureDocuments: SanityDocument[] = [
  {
    _id: 'author-austen',
    _type: 'author',
    _rev: 'rev-austen-1',
    _createdAt: '2026-01-05T09:00:00Z',
    _updatedAt: '2026-01-05T09:00:00Z',
    name: 'Jane Austen',
    era: 'Regency',
  },
  {
    _id: 'author-tolstoy',
    _type: 'author',
    _rev: 'rev-tolstoy-1',
    _createdAt: '2026-01-06T10:00:00Z',
    _updatedAt: '2026-01-06T10:00:00Z',
    name: 'Leo Tolstoy',
    era: 'Realism',
  },
  {
    _id: 'drafts.author-tolstoy',
    _type: 'author',
    _rev: 'rev-tolstoy-draft-2',
    _createdAt: '2026-01-06T10:00:00Z',
    _updatedAt: '2026-02-01T12:00:00Z',
    name: 'Leo Tolstoy (edited)',
    era: 'Realism',
  },
  {
    _id: 'drafts.author-lem',
    _type: 'author',
    _rev: 'rev-lem-draft-1',
    _createdAt: '2026-02-10T08:00:00Z',
    _updatedAt: '2026-02-10T08:00:00Z',
    name: 'Stanisław Lem',
    era: 'Science fiction',
  },
  {
    _id: 'author-bronte',
    _type: 'author',
    _rev: 'rev-bronte-1',
    _createdAt: '2026-01-07T11:00:00Z',
    _updatedAt: '2026-01-07T11:00:00Z',
    name: 'Charlotte Brontë',
    era: 'Victorian',
  },
  {
    _id: 'author-woolf',
    _type: 'author',
    _rev: 'rev-woolf-1',
    _createdAt: '2026-01-08T12:00:00Z',
    _updatedAt: '2026-01-08T12:00:00Z',
    name: 'Virginia Woolf',
    era: 'Modernism',
  },
  {
    _id: 'drafts.book-anna-karenina',
    _type: 'book',
    _rev: 'rev-book-draft-1',
    _createdAt: '2026-03-01T09:00:00Z',
    _updatedAt: '2026-03-01T09:00:00Z',
    title: 'Anna Karenina',
  },
]
