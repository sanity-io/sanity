import {type ReleaseDocument, type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, startWith} from 'rxjs/operators'

import {useClient} from '../../hooks/useClient'
import {buildInventoryIndex, toVersionStub} from '../../inventoryModel/buildInventoryIndex'
import {documentLens} from '../../inventoryModel/lenses'
import {type VersionStub} from '../../inventoryModel/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {listenQuery, type ListenQueryParams} from '../../store/document/listenQuery'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'

/**
 * How many versions the first version of the Document lens reads: the most recently edited ones.
 * The paged inventory feed (SAPP-4878) replaces this cap.
 *
 * @internal
 */
export const VERSION_INVENTORY_LIMIT = 500

// Content versions only: no system documents (variant definitions, releases) and no assets.
const CONTENT_FILTER = `defined(_system.group) && !(_id in path("_.**")) && !string::startsWith(_type, "sanity.")`

/**
 * The fetch and listen queries for {@link listenVersionInventory}. With `types`, only versions of
 * those types; otherwise every content type. Fetches one more than the limit to tell whether the
 * result was cut.
 *
 * @internal
 */
export function buildVersionInventoryQuery(types: string[]): {fetch: string; listen: string} {
  const filter = types.length > 0 ? `${CONTENT_FILTER} && _type in $types` : CONTENT_FILTER
  return {
    fetch: `*[${filter}] | order(_updatedAt desc) [0...${VERSION_INVENTORY_LIMIT + 1}]{_id, _rev, _createdAt, _updatedAt, _type, _system}`,
    listen: `*[${filter}]`,
  }
}

/**
 * What the Document lens is computed from. This is the seam: today it is one bounded live query
 * ({@link listenVersionInventory}); the paged inventory feed can produce the same shape.
 *
 * @internal
 */
export interface VersionInventorySource {
  loading: boolean
  error: Error | null
  versions: VersionInfoDocumentStub[]
  /** More versions exist than were read. */
  truncated: boolean
}

const LOADING_SOURCE: VersionInventorySource = {
  loading: true,
  error: null,
  versions: [],
  truncated: false,
}

/**
 * Keeps the most recently edited versions of `types` (every content type when empty) live.
 *
 * @internal
 */
export function listenVersionInventory(
  client: SanityClient,
  types: string[],
): Observable<VersionInventorySource> {
  const params: ListenQueryParams = types.length > 0 ? {types} : {}
  return listenQuery(client, buildVersionInventoryQuery(types), params, {
    // Variant and release versions are only visible to the raw perspective.
    perspective: 'raw',
    tag: 'variants.document-lens',
  }).pipe(
    map((data: VersionInfoDocumentStub[] | null): VersionInventorySource => ({
      loading: false,
      error: null,
      versions: (data ?? []).slice(0, VERSION_INVENTORY_LIMIT),
      truncated: (data ?? []).length > VERSION_INVENTORY_LIMIT,
    })),
    startWith(LOADING_SOURCE),
    catchError((error: unknown) =>
      of({
        ...LOADING_SOURCE,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }),
    ),
  )
}

/**
 * The Document lens, ready to render: one row per stored version, in the shared version order.
 *
 * @internal
 */
export interface VersionInventory {
  loading: boolean
  error: Error | null
  rows: VersionStub[]
  truncated: boolean
}

/**
 * Turns a {@link VersionInventorySource} into the Document lens rows with the shared model.
 * Agent versions are left out, as in every other lens.
 *
 * @internal
 */
export function toVersionInventory(
  source: VersionInventorySource,
  releases: Map<string, ReleaseDocument>,
): VersionInventory {
  const stubs = source.versions.flatMap((version) => {
    const stub = toVersionStub(version)
    return stub ? [stub] : []
  })
  return {
    loading: source.loading,
    error: source.error,
    rows: documentLens(buildInventoryIndex({versions: stubs, releases})),
    truncated: source.truncated,
  }
}

/**
 * Live Document lens across documents: the most recently edited versions of `types` (every
 * content type when empty), capped at {@link VERSION_INVENTORY_LIMIT}.
 *
 * @internal
 */
export function useVersionInventory(types: string[]): VersionInventory {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  const {byId: releases} = useActiveReleases()
  // Key on a primitive so a new array with the same types does not restart the listener.
  const typesKey = types.toSorted().join(',')

  const source$ = useMemo(
    () => listenVersionInventory(client, typesKey ? typesKey.split(',') : []),
    [client, typesKey],
  )
  const source = useObservable(source$, LOADING_SOURCE)

  return useMemo(() => toVersionInventory(source, releases), [source, releases])
}
