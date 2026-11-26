import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of, Subject} from 'rxjs'
import {filter} from 'rxjs/operators'
import {describe, expect, it, vi} from 'vitest'

import {getNearestBaseVersion} from '../../../documentGroupInventory/components/CreateVariant/getNearestBaseVersion'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type VariantId} from '../../types'
import {
  buildDefinitionInventoryQueries,
  type DefinitionInventorySource,
  listenDefinitionInventory,
  type RawVersionStub,
  toVariantDefinitionLens,
} from '../useVariantDefinitionLens'

const GERMAN = '_.variants.german' as VariantId

function published(groupId: string, type = 'product'): VersionInfoDocumentStub {
  return {
    _id: groupId,
    _rev: 'rev',
    _type: type,
    _createdAt: '2026-11-01T00:00:00Z',
    _updatedAt: '2026-11-01T00:00:00Z',
    _system: {group: {_ref: groupId, _weak: true}},
  }
}

function draft(groupId: string, type = 'product'): VersionInfoDocumentStub {
  return {
    ...published(groupId, type),
    _id: `drafts.${groupId}`,
    _system: {group: {_ref: groupId, _weak: true}, bundleId: 'drafts'},
  }
}

function germanDraft(groupId: string, type = 'product'): VersionInfoDocumentStub {
  return {
    ...published(groupId, type),
    _id: `versions.german.${groupId}`,
    _system: {
      group: {_ref: groupId, _weak: true},
      bundleId: 'drafts',
      variants: [{_ref: GERMAN, _key: 'k'}],
    },
  }
}

describe('toVariantDefinitionLens', () => {
  it('splits the universe into documents with and without a version', () => {
    const source: DefinitionInventorySource = {
      loading: false,
      error: null,
      versions: [germanDraft('jacket')],
      universe: [
        published('jacket'),
        germanDraft('jacket'),
        published('boots'),
        draft('boots'),
        draft('scarf'),
      ],
      types: ['product'],
    }

    const lens = toVariantDefinitionLens(source, GERMAN)

    expect(lens.present).toEqual([{groupId: 'jacket', state: 'draft'}])
    expect(lens.missing.map((row) => row.groupId)).toEqual(['boots', 'scarf'])
    expect(lens.missing[0]).toMatchObject({_type: 'product', state: 'absent'})
    // Every version of a missing document is kept, so creating can start from the nearest one.
    expect(lens.missing[0]!.versions.map((version) => version._id)).toEqual([
      'boots',
      'drafts.boots',
    ])
    expect(lens.typesWithVersions).toEqual(['product'])
  })

  it('counts a document with a version as present even outside the chosen types', () => {
    const lens = toVariantDefinitionLens(
      {
        loading: false,
        error: null,
        versions: [germanDraft('home', 'page')],
        universe: [published('jacket')],
        types: ['product'],
      },
      GERMAN,
    )

    expect(lens.present.map((row) => row.groupId)).toEqual(['home'])
    expect(lens.missing.map((row) => row.groupId)).toEqual(['jacket'])
    expect(lens.typesWithVersions).toEqual(['page'])
  })
})

// The shapes Content Lake returns today: only variant versions carry `_system.group`.
function raw(id: string, system: RawVersionStub['_system']): RawVersionStub {
  return {
    _id: id,
    _rev: `rev-${id}`,
    _type: 'product',
    _createdAt: '2026-11-01T00:00:00Z',
    _updatedAt: '2026-11-01T00:00:00Z',
    _system: system,
  }
}

describe('raw version shapes', () => {
  const publishedBoots = raw('boots', {base: {id: 'boots', rev: 'r1'}} as RawVersionStub['_system'])
  const draftBoots = raw('drafts.boots', null)
  const releaseBoots = raw('versions.rSpring.boots', null)
  const source: DefinitionInventorySource = {
    loading: false,
    error: null,
    versions: [germanDraft('jacket')],
    universe: [
      raw('jacket', null),
      germanDraft('jacket'),
      publishedBoots,
      draftBoots,
      releaseBoots,
    ],
    types: ['product'],
  }

  it('groups published, classic draft and release versions under the published id', () => {
    const lens = toVariantDefinitionLens(source, GERMAN)

    expect(lens.present.map((row) => row.groupId)).toEqual(['jacket'])
    expect(lens.missing).toHaveLength(1)
    expect(lens.missing[0]).toMatchObject({groupId: 'boots', _type: 'product'})
    expect(lens.missing[0]!.versions.map((version) => version._id)).toEqual([
      'boots',
      'drafts.boots',
      'versions.rSpring.boots',
    ])
    // Every version now has the `_system` its id implies.
    expect(lens.missing[0]!.versions.map((version) => version._system.bundleId)).toEqual([
      undefined,
      'drafts',
      'rSpring',
    ])
  })

  it('starts a new version from the classic draft, or from the release version', () => {
    const {versions} = toVariantDefinitionLens(source, GERMAN).missing[0]!

    expect(
      getNearestBaseVersion({variantId: GERMAN, bundle: {type: 'drafts'}, versions})?._id,
    ).toBe('drafts.boots')
    expect(
      getNearestBaseVersion({
        variantId: GERMAN,
        bundle: {type: 'release', releaseId: '_.releases.rSpring'},
        versions,
      })?._id,
    ).toBe('versions.rSpring.boots')
  })

  it('starts from the published version when there is no draft', () => {
    const lens = toVariantDefinitionLens({...source, universe: [publishedBoots]}, GERMAN)
    expect(
      getNearestBaseVersion({
        variantId: GERMAN,
        bundle: {type: 'drafts'},
        versions: lens.missing[0]!.versions,
      })?._id,
    ).toBe('boots')
  })
})

type ListenerEvent = {type: 'welcome' | 'mutation'; transition?: 'update'; visibility?: 'query'}

function createMockClient(responses: {
  versions: () => VersionInfoDocumentStub[]
  universe: () => VersionInfoDocumentStub[]
}) {
  const listeners = new Map<string, Subject<ListenerEvent>>()
  const fetch = vi.fn((query: string) =>
    of(query.includes('partOfVariant') ? responses.versions() : responses.universe()),
  )
  const listen = vi.fn((query: string) => {
    const listener$ = new Subject<ListenerEvent>()
    listeners.set(query, listener$)
    return listener$
  })
  const client = {
    listen,
    observable: {fetch},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient

  return {client, fetch, listen, listeners}
}

const queries = buildDefinitionInventoryQueries()

describe('listenDefinitionInventory', () => {
  it('reads the versions and the universe of the types with a version by default', async () => {
    const {client, fetch, listen, listeners} = createMockClient({
      versions: () => [germanDraft('jacket')],
      universe: () => [published('jacket'), germanDraft('jacket'), published('boots')],
    })

    const settled = firstValueFrom(
      listenDefinitionInventory(client, GERMAN, undefined).pipe(
        filter((source) => !source.loading),
      ),
    )

    listeners.get(queries.versions.listen)!.next({type: 'welcome'})
    await vi.waitFor(() => expect(listeners.has(queries.universe.listen)).toBe(true))
    listeners.get(queries.universe.listen)!.next({type: 'welcome'})

    const source = await settled
    expect(source.types).toEqual(['product'])
    expect(listen).toHaveBeenCalledWith(
      queries.universe.listen,
      {types: ['product']},
      expect.anything(),
    )
    expect(fetch).toHaveBeenCalledWith(
      queries.versions.fetch,
      {variantId: 'german'},
      expect.objectContaining({perspective: 'raw'}),
    )

    const lens = toVariantDefinitionLens(source, GERMAN)
    expect(lens.present.map((row) => row.groupId)).toEqual(['jacket'])
    expect(lens.missing.map((row) => row.groupId)).toEqual(['boots'])
  })

  it('reads no universe when no type is chosen and nothing has a version yet', async () => {
    const {client, listen, listeners} = createMockClient({
      versions: () => [],
      universe: () => [published('boots')],
    })

    const settled = firstValueFrom(
      listenDefinitionInventory(client, GERMAN, undefined).pipe(
        filter((source) => !source.loading),
      ),
    )
    listeners.get(queries.versions.listen)!.next({type: 'welcome'})

    const source = await settled
    expect(source.types).toEqual([])
    expect(source.universe).toEqual([])
    expect(listen).toHaveBeenCalledTimes(1)
  })

  it('moves a document from missing to present when a version is created', async () => {
    let versions = [germanDraft('jacket')]
    const universe = () => [published('jacket'), germanDraft('jacket'), ...extra]
    let extra: VersionInfoDocumentStub[] = [published('boots')]
    const {client, listeners} = createMockClient({versions: () => versions, universe})

    const emissions: DefinitionInventorySource[] = []
    const subscription = listenDefinitionInventory(client, GERMAN, ['product']).subscribe(
      (source) => emissions.push(source),
    )

    listeners.get(queries.versions.listen)!.next({type: 'welcome'})
    listeners.get(queries.universe.listen)!.next({type: 'welcome'})
    await vi.waitFor(() => {
      expect(toVariantDefinitionLens(emissions.at(-1)!, GERMAN).missing).toHaveLength(1)
    })

    // A German version of "boots" is created: both reads see a mutation and refetch.
    versions = [germanDraft('jacket'), germanDraft('boots')]
    extra = [published('boots'), germanDraft('boots')]
    listeners
      .get(queries.versions.listen)!
      .next({type: 'mutation', transition: 'update', visibility: 'query'})
    listeners
      .get(queries.universe.listen)!
      .next({type: 'mutation', transition: 'update', visibility: 'query'})

    await vi.waitFor(() => {
      const lens = toVariantDefinitionLens(emissions.at(-1)!, GERMAN)
      expect(lens.present.map((row) => row.groupId).toSorted()).toEqual(['boots', 'jacket'])
      expect(lens.missing).toEqual([])
    })

    subscription.unsubscribe()
  })
})
