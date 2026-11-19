import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, type Observable, of} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators'

import {useClient} from '../../hooks/useClient'
import {buildInventoryIndex, toVersionStub} from '../../inventoryModel/buildInventoryIndex'
import {type DefinitionLensRow, definitionLens} from '../../inventoryModel/lenses'
import {type VersionStub} from '../../inventoryModel/types'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {listenQuery, type ListenQueryParams} from '../../store/document/listenQuery'
import {getPublishedId} from '../../util/draftUtils'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'
import {getVariantId} from '../tool/util'
import {type VariantId} from '../types'

const STUB_PROJECTION = '{_id, _rev, _createdAt, _updatedAt, _type, _system}'

/**
 * The two reads behind the Definition lens of one variant definition.
 *
 * @internal
 */
export interface DefinitionInventoryQueries {
  /** Every version that belongs to the definition. */
  versions: {fetch: string; listen: string}
  /** Every version of the chosen document types: the documents the definition could apply to. */
  universe: {fetch: string; listen: string}
}

/**
 * Builds the fetch and listen queries for {@link listenDefinitionInventory}.
 *
 * @internal
 */
export function buildDefinitionInventoryQueries(): DefinitionInventoryQueries {
  return {
    versions: {
      fetch: `*[sanity::partOfVariant($variantId)]${STUB_PROJECTION}`,
      listen: `*[sanity::partOfVariant($variantId)]`,
    },
    universe: {
      fetch: `*[_type in $types]${STUB_PROJECTION}`,
      listen: `*[_type in $types]`,
    },
  }
}

/**
 * What the Definition lens is computed from. This is the seam: today it comes from two live
 * queries ({@link listenDefinitionInventory}); the paged inventory feed can produce the same shape.
 *
 * @internal
 */
export interface DefinitionInventorySource {
  loading: boolean
  error: Error | null
  /** The version stubs that belong to the definition. */
  versions: VersionInfoDocumentStub[]
  /** The version stubs of every document of `types`. */
  universe: VersionInfoDocumentStub[]
  /** The document types the universe was read for. */
  types: string[]
}

interface ReadState {
  loading: boolean
  error: Error | null
  data: VersionInfoDocumentStub[]
}

const LOADING: ReadState = {loading: true, error: null, data: []}

function listenStubs(
  client: SanityClient,
  query: {fetch: string; listen: string},
  params: ListenQueryParams,
  tag: string,
): Observable<ReadState> {
  return listenQuery(client, query, params, {
    // Variant and release versions are only visible to the raw perspective.
    perspective: 'raw',
    tag,
  }).pipe(
    map((data: VersionInfoDocumentStub[] | null): ReadState => ({
      loading: false,
      error: null,
      data: data ?? [],
    })),
    startWith(LOADING),
    catchError((error: unknown) =>
      of({
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: [],
      }),
    ),
  )
}

/**
 * The document types that already have a version for the definition, sorted.
 *
 * @internal
 */
export function getTypesWithVersions(versions: VersionInfoDocumentStub[]): string[] {
  return [...new Set(versions.map((version) => version._type))].toSorted()
}

/**
 * Keeps the two reads live: the versions of the definition, and every version of the chosen
 * types. Both update when versions are created or deleted.
 *
 * When `types` is `undefined`, the universe defaults to the types that already have a version
 * for the definition, and follows them as they change.
 *
 * @internal
 */
export function listenDefinitionInventory(
  client: SanityClient,
  variantDocumentId: string,
  types: string[] | undefined,
): Observable<DefinitionInventorySource> {
  const queries = buildDefinitionInventoryQueries()
  const versions$ = listenStubs(
    client,
    queries.versions,
    {variantId: getVariantId(variantDocumentId)},
    'variants.definition-lens.versions',
  ).pipe(shareReplay({bufferSize: 1, refCount: true}))

  const types$: Observable<string[] | undefined> = types
    ? of(types)
    : versions$.pipe(
        // Wait for the first answer before choosing default types, so the universe is not read
        // for an empty type list first.
        map((state) => (state.loading ? undefined : getTypesWithVersions(state.data))),
        distinctUntilChanged((previous, next) => previous?.join(',') === next?.join(',')),
      )

  const universe$ = types$.pipe(
    switchMap((resolvedTypes) => {
      if (!resolvedTypes) return of({...LOADING, types: []})
      if (resolvedTypes.length === 0) {
        return of({loading: false, error: null, data: [], types: resolvedTypes})
      }
      return listenStubs(
        client,
        queries.universe,
        {types: resolvedTypes},
        'variants.definition-lens.universe',
      ).pipe(map((state) => ({...state, types: resolvedTypes})))
    }),
  )

  return combineLatest([versions$, universe$]).pipe(
    map(([versions, universe]) => ({
      loading: versions.loading || universe.loading,
      error: versions.error ?? universe.error,
      versions: versions.data,
      universe: universe.data,
      types: universe.types,
    })),
  )
}

/**
 * A document of the chosen types that has no version for the definition.
 *
 * @internal
 */
export interface MissingDocumentRow extends DefinitionLensRow {
  _type: string
  /** The document's stored versions, used to pick the version a new variant starts from. */
  versions: VersionInfoDocumentStub[]
}

/**
 * The Definition lens of one variant definition, ready to render.
 *
 * @internal
 */
export interface VariantDefinitionLens {
  loading: boolean
  error: Error | null
  /** Documents that have a version for the definition ("Has a version"). */
  present: DefinitionLensRow[]
  /** Documents of `types` that have no version for the definition ("Missing"). */
  missing: MissingDocumentRow[]
  /** The document types the Missing half was computed for. */
  types: string[]
  /** The document types that already have a version for the definition. */
  typesWithVersions: string[]
}

function getGroupId(stub: VersionInfoDocumentStub): string {
  return stub._system?.group?._ref ?? getPublishedId(stub._id)
}

/**
 * Splits a {@link DefinitionInventorySource} into the present and missing halves with the shared
 * {@link definitionLens}. Missing = the universe's documents minus those with a version.
 *
 * @internal
 */
export function toVariantDefinitionLens(
  source: DefinitionInventorySource,
  variantDocumentId: VariantId,
): VariantDefinitionLens {
  const stubs = source.versions.flatMap((version) => {
    const stub = toVersionStub(version)
    return stub ? [stub] : []
  }) satisfies VersionStub[]
  // The rows are sorted by the table, so the release order does not matter here.
  const index = buildInventoryIndex({versions: stubs, releases: new Map()})

  const universeByGroup = new Map<string, VersionInfoDocumentStub[]>()
  for (const stub of source.universe) {
    const groupId = getGroupId(stub)
    const group = universeByGroup.get(groupId)
    if (group) {
      group.push(stub)
    } else {
      universeByGroup.set(groupId, [stub])
    }
  }

  const {present, absent} = definitionLens(index, variantDocumentId, universeByGroup.keys())

  return {
    loading: source.loading,
    error: source.error,
    present,
    missing: absent.map((row) => {
      const versions = universeByGroup.get(row.groupId) ?? []
      return {...row, _type: versions[0]?._type ?? '', versions}
    }),
    types: source.types,
    typesWithVersions: getTypesWithVersions(source.versions),
  }
}

const EMPTY_LENS: VariantDefinitionLens = {
  loading: false,
  error: null,
  present: [],
  missing: [],
  types: [],
  typesWithVersions: [],
}

const LOADING_LENS: VariantDefinitionLens = {...EMPTY_LENS, loading: true}

/**
 * Live Definition lens for one variant definition: the documents that have a version for it, and
 * the documents of `types` that do not. With `types` left `undefined`, the types that already have
 * a version for the definition are used.
 *
 * @internal
 */
export function useVariantDefinitionLens({
  variantDocumentId,
  types,
}: {
  variantDocumentId: VariantId | undefined
  types: string[] | undefined
}): VariantDefinitionLens {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  // Key on a primitive so a new array with the same types does not restart the listeners.
  const typesKey = types ? types.toSorted().join(',') : undefined

  const lens$ = useMemo(() => {
    if (!variantDocumentId) return of(EMPTY_LENS)
    const resolvedTypes =
      typeof typesKey === 'string' ? typesKey.split(',').filter(Boolean) : undefined
    return listenDefinitionInventory(client, variantDocumentId, resolvedTypes).pipe(
      map((source) => toVariantDefinitionLens(source, variantDocumentId)),
    )
  }, [client, typesKey, variantDocumentId])

  return useObservable(lens$, LOADING_LENS)
}
