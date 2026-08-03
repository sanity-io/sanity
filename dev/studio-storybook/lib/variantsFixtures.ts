/**
 * Fixture world for the Content Variants surfaces (`beta.variants.enabled`).
 *
 * The variants feature has two data paths, and each gets its own seam here:
 *
 * 1. The variants STORE (`useVariantsStore` → `createVariantsStore`) runs
 *    `listenQuery` against the workspace client: one listener (kept open) plus a
 *    fetch of the `system.variant` list query, and a second aggregate fetch for
 *    per-variant document counts (`sanity::partOfVariant(...)` projections).
 *    {@link createVariantsFixtureClient} answers BOTH queries from fixtures and
 *    delegates everything else to `createStructureFixtureClient` (whose `listen`
 *    already stays open with an async welcome — the shape `listenQuery` needs).
 *    The REAL store, reducer and hooks run unmodified on top.
 *
 * 2. The variant DETAIL table (`useVariantDocuments` → `useBundleDocuments`)
 *    resolves its documents through the document preview store:
 *    `unstable_observeDocumentIdSet(groqFilter)` for membership, then
 *    `unstable_observeDocument` + pair availability + real validation per id.
 *    {@link createVariantsPreviewStore} wraps the shared mock preview store and
 *    answers only the `partOfVariant` id-set query from a membership map — every
 *    downstream read (previews, validation, availability) is the real machinery
 *    against the same fixture documents.
 *
 * Ids follow the production conventions: variant definitions live at
 * `_.variants.<id>` (`system.variant`), variant-scoped documents are version
 * documents (`versions.<bundleId>.<publishedId>`) whose `_system` carries the
 * document group ref, bundle id, release ref and variant ref — the fields
 * `toVariantDocumentVersion` / `groupVariantDocumentsByGroup` group rows by.
 */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {type Observable, of} from 'rxjs'

import {type DocumentPreviewStore} from '../../../packages/sanity/src/core/preview/documentPreviewStore'
import {
  VARIANT_DOCUMENT_TYPE,
  VARIANT_DOCUMENTS_PATH,
} from '../../../packages/sanity/src/core/variants/store/constants'
import {type SystemVariant} from '../../../packages/sanity/src/core/variants/types'
import {createMockPreviewUniverse} from './mockDocumentPreviewStore'
import {createStructureFixtureClient} from './structureHarness'

function descriptionBlock(text: string) {
  return {
    _type: 'block',
    _key: `desc-${text.length}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 'span0', text, marks: []}],
  }
}

/**
 * Three variant definitions exercising the states the overview renders:
 * - `summer-sale` — title + description + two conditions, and documents in it
 * - `nordics` — locale/market targeting, one document
 * - `enterprise` — NO `metadata.title`, so the UI falls back to the raw id
 *   (the real fallback path in `getVariantTitle`), and zero documents
 */
export const fixtureVariants: SystemVariant[] = [
  {
    _id: `${VARIANT_DOCUMENTS_PATH}.summer-sale`,
    _type: VARIANT_DOCUMENT_TYPE,
    _createdAt: '2026-07-01T09:00:00Z',
    _updatedAt: '2026-07-18T10:00:00Z',
    _rev: 'rev-variant-summer-1',
    conditions: {audience: 'returning-customers', market: 'emea'},
    priority: 2,
    metadata: {
      title: 'Summer sale',
      description: [
        descriptionBlock('Returning EMEA customers see seasonal campaign copy and pricing.'),
      ],
    },
  },
  {
    _id: `${VARIANT_DOCUMENTS_PATH}.nordics`,
    _type: VARIANT_DOCUMENT_TYPE,
    _createdAt: '2026-06-12T09:00:00Z',
    _updatedAt: '2026-06-20T10:00:00Z',
    _rev: 'rev-variant-nordics-1',
    conditions: {locale: 'nb-NO', market: 'nordics'},
    priority: 1,
    metadata: {
      title: 'Norwegian market',
      description: [descriptionBlock('Norwegian-language content for the Nordics storefront.')],
    },
  },
  {
    _id: `${VARIANT_DOCUMENTS_PATH}.enterprise`,
    _type: VARIANT_DOCUMENT_TYPE,
    _createdAt: '2026-05-02T09:00:00Z',
    _updatedAt: '2026-05-02T09:00:00Z',
    _rev: 'rev-variant-enterprise-1',
    conditions: {plan: 'enterprise'},
    priority: 0,
  },
]

/**
 * Document counts as the aggregate count query would return them, keyed by
 * variant definition document id. Counts count document GROUPS (rows in the
 * detail table), so they match {@link fixtureVariantMembership}: the summer-sale
 * variant holds two groups (one of them present in two release bundles).
 */
export const fixtureVariantDocumentCounts: Record<string, number> = {
  [`${VARIANT_DOCUMENTS_PATH}.summer-sale`]: 2,
  [`${VARIANT_DOCUMENTS_PATH}.nordics`]: 1,
  [`${VARIANT_DOCUMENTS_PATH}.enterprise`]: 0,
}

/**
 * Variant-scoped version documents plus their published bases. `_system.release`
 * refs point at the shared `fixtureReleases` (testProvider) so the detail
 * table's bundle chips resolve real release titles ("Hotfix launch" /
 * "Spring campaign"). `versions.rScheduled.book-atlas` intentionally omits its
 * required `title` so the real validation pipeline flags the row.
 */
export const fixtureVariantDocuments: SanityDocument[] = [
  {
    _id: 'book-solaris-guide',
    _type: 'book',
    _rev: 'rev-solaris-pub-1',
    _createdAt: '2026-04-01T09:00:00Z',
    _updatedAt: '2026-04-01T09:00:00Z',
    title: 'Solaris: A Reader’s Guide',
    year: 2024,
  },
  {
    _id: 'versions.rAsap.book-solaris-guide',
    _type: 'book',
    _rev: 'rev-solaris-asap-2',
    _createdAt: '2026-07-02T09:00:00Z',
    _updatedAt: '2026-07-20T15:00:00Z',
    _system: {
      group: {_ref: 'grp-solaris-guide'},
      bundleId: 'rAsap',
      release: {_ref: '_.releases.rAsap'},
      variant: {_ref: `${VARIANT_DOCUMENTS_PATH}.summer-sale`},
    },
    title: 'Solaris: A Reader’s Guide — Summer edit',
    year: 2024,
  },
  {
    _id: 'versions.rScheduled.book-solaris-guide',
    _type: 'book',
    _rev: 'rev-solaris-sched-1',
    _createdAt: '2026-07-03T09:00:00Z',
    _updatedAt: '2026-07-19T11:00:00Z',
    _system: {
      group: {_ref: 'grp-solaris-guide'},
      bundleId: 'rScheduled',
      release: {_ref: '_.releases.rScheduled'},
      variant: {_ref: `${VARIANT_DOCUMENTS_PATH}.summer-sale`},
    },
    title: 'Solaris: A Reader’s Guide — Campaign edit',
    year: 2024,
  },
  {
    _id: 'versions.rScheduled.book-atlas',
    _type: 'book',
    _rev: 'rev-atlas-sched-1',
    _createdAt: '2026-07-05T09:00:00Z',
    _updatedAt: '2026-07-21T09:00:00Z',
    _system: {
      group: {_ref: 'grp-atlas'},
      bundleId: 'rScheduled',
      release: {_ref: '_.releases.rScheduled'},
      variant: {_ref: `${VARIANT_DOCUMENTS_PATH}.summer-sale`},
    },
    // `title` intentionally missing → required-field validation error in the table
    year: 2026,
  },
  {
    _id: 'versions.rAsap.book-nordic',
    _type: 'book',
    _rev: 'rev-nordic-asap-1',
    _createdAt: '2026-06-15T09:00:00Z',
    _updatedAt: '2026-06-25T09:00:00Z',
    _system: {
      group: {_ref: 'grp-nordic'},
      bundleId: 'rAsap',
      release: {_ref: '_.releases.rAsap'},
      variant: {_ref: `${VARIANT_DOCUMENTS_PATH}.nordics`},
    },
    title: 'Nordlys: En håndbok',
    year: 2025,
  },
]

/**
 * Which version documents belong to which variant, keyed by the SHORT variant id
 * (`sanity::partOfVariant()` receives the id without the `_.variants.` prefix —
 * see `buildVariantsDocumentCountsQuery` / `useVariantDocuments`).
 */
export const fixtureVariantMembership: Record<string, string[]> = {
  'summer-sale': [
    'versions.rAsap.book-solaris-guide',
    'versions.rScheduled.book-solaris-guide',
    'versions.rScheduled.book-atlas',
  ],
  'nordics': ['versions.rAsap.book-nordic'],
  'enterprise': [],
}

export interface VariantsFixtureClientOptions {
  /** Variant definitions served to the variants store's list query. */
  variants: SystemVariant[]
  /** Aggregate document counts, keyed by variant definition document id. */
  counts?: Record<string, number>
  /** Documents behind the base structure fixture client (searches, snapshots). */
  documents?: SanityDocument[]
}

/**
 * A `createStructureFixtureClient` wrapped with the two variants-store queries.
 * Everything else (open listeners, `/acl`, keyvalue, `getDocuments`) falls
 * through to the structure fixture client, so the REAL `createVariantsStore`
 * and `useVariantsDocumentCounts` pipelines run against this client end to end.
 */
export function createVariantsFixtureClient(options: VariantsFixtureClientOptions): SanityClient {
  const {variants, counts = {}, documents = []} = options
  const base = createStructureFixtureClient({documents})

  // The store's query sorts `order(_createdAt desc)` server-side; mirror it.
  const sortedVariants = [...variants].sort((a, b) => (a._createdAt < b._createdAt ? 1 : -1))

  const fetch = (
    query: string,
    params?: Record<string, unknown>,
    fetchOptions?: Record<string, unknown>,
  ): Observable<unknown> => {
    // The variants list query (`*[_type=="system.variant" && _id in path("_.variants.*")]`).
    if (query.includes(`_type=="${VARIANT_DOCUMENT_TYPE}"`)) {
      return of(sortedVariants)
    }
    // The aggregate counts query — a bare projection object of
    // `"<variantDocId>": count(...partOfVariant...)` entries.
    if (query.trimStart().startsWith('{') && query.includes('partOfVariant')) {
      return of(counts)
    }
    return (
      base.observable.fetch as (
        q: string,
        p?: Record<string, unknown>,
        o?: Record<string, unknown>,
      ) => Observable<unknown>
    )(query, params, fetchOptions)
  }

  const client = {
    ...base,
    observable: {...base.observable, fetch},
    withConfig: () => client,
  }

  return client as unknown as SanityClient
}

export interface VariantsPreviewStoreOptions {
  /** Fixture documents, keyed by `_id` (see `createMockPreviewUniverse`). */
  documents: SanityDocument[]
  /** Version-document membership per SHORT variant id. */
  membership: Record<string, string[]>
}

/**
 * The shared mock preview store with ONE override: the id-set observer answers
 * `sanity::partOfVariant($variantId)` filters from the membership map, which is
 * exactly the seam `useBundleDocuments` resolves a variant's documents through.
 */
export function createVariantsPreviewStore(
  options: VariantsPreviewStoreOptions,
): DocumentPreviewStore {
  const inner = createMockPreviewUniverse({documents: options.documents}).store

  return {
    ...inner,
    unstable_observeDocumentIdSet: (queryFilter, params, observeOptions) => {
      if (queryFilter.includes('partOfVariant')) {
        const variantId = typeof params?.variantId === 'string' ? params.variantId : ''
        return of({
          status: 'connected' as const,
          documentIds: options.membership[variantId] ?? [],
        })
      }
      return inner.unstable_observeDocumentIdSet(queryFilter, params, observeOptions)
    },
  }
}
