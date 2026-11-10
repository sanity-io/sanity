import {type ReleaseDocument, type SanityClient} from '@sanity/client'
import {firstValueFrom, of, Subject} from 'rxjs'
import {filter} from 'rxjs/operators'
import {describe, expect, it, vi} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type VariantId} from '../../types'
import {
  buildVersionInventoryQuery,
  listenVersionInventory,
  toVersionInventory,
  VERSION_INVENTORY_LIMIT,
  type VersionInventorySource,
} from '../useVersionInventory'

const GERMAN = '_.variants.german' as VariantId

function version(
  id: string,
  groupId: string,
  system: Partial<VersionInfoDocumentStub['_system']> = {},
): VersionInfoDocumentStub {
  return {
    _id: id,
    _rev: 'rev',
    _type: 'product',
    _createdAt: '2026-11-01T00:00:00Z',
    _updatedAt: '2026-11-01T00:00:00Z',
    _system: {group: {_ref: groupId, _weak: true}, ...system},
  }
}

const release = {
  _id: '_.releases.rSpring',
  _type: 'system.release',
  _rev: 'rev',
  _createdAt: '2026-11-01T00:00:00Z',
  _updatedAt: '2026-11-01T00:00:00Z',
  name: 'rSpring',
  state: 'active',
  metadata: {title: 'Spring', releaseType: 'asap'},
} as ReleaseDocument

describe('buildVersionInventoryQuery', () => {
  it('reads content versions only, most recent first, one past the limit', () => {
    const {fetch, listen} = buildVersionInventoryQuery([])
    expect(fetch).toContain('defined(_system.group)')
    expect(fetch).toContain('!(_id in path("_.**"))')
    expect(fetch).toContain(`| order(_updatedAt desc) [0...${VERSION_INVENTORY_LIMIT + 1}]`)
    expect(listen).not.toContain('$types')
  })

  it('narrows to the chosen types', () => {
    const {fetch, listen} = buildVersionInventoryQuery(['product'])
    expect(fetch).toContain('_type in $types')
    expect(listen).toContain('_type in $types')
  })
})

describe('toVersionInventory', () => {
  it('returns one row per version in the shared order, without agent versions', () => {
    const source: VersionInventorySource = {
      loading: false,
      error: null,
      truncated: false,
      versions: [
        version('versions.rSpring.jacket', 'jacket', {
          bundleId: 'rSpring',
          release: {_ref: release._id, _weak: true},
        }),
        version('versions.agent-abc.jacket', 'jacket', {bundleId: 'agent-abc'}),
        version('versions.german.jacket', 'jacket', {
          bundleId: 'drafts',
          variants: [{_ref: GERMAN, _key: 'k'}],
        }),
        version('drafts.jacket', 'jacket', {bundleId: 'drafts'}),
        version('jacket', 'jacket'),
      ],
    }

    const {rows} = toVersionInventory(source, new Map([[release._id, release]]))

    expect(rows.map((row) => row._id)).toEqual([
      'jacket',
      'drafts.jacket',
      'versions.german.jacket',
      'versions.rSpring.jacket',
    ])
    expect(rows.map((row) => row.kind)).toEqual(['published', 'draft', 'draft', 'release'])
  })
})

type ListenerEvent = {type: 'welcome' | 'mutation'; transition?: 'update'; visibility?: 'query'}

function createMockClient(response: () => VersionInfoDocumentStub[]) {
  const listeners: Subject<ListenerEvent>[] = []
  const fetch = vi.fn(() => of(response()))
  const listen = vi.fn(() => {
    const listener$ = new Subject<ListenerEvent>()
    listeners.push(listener$)
    return listener$
  })
  const client = {
    listen,
    observable: {fetch},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient
  return {client, fetch, listen, listeners}
}

describe('listenVersionInventory', () => {
  it('caps the versions at the limit and says the list was cut', async () => {
    const many = Array.from({length: VERSION_INVENTORY_LIMIT + 1}, (_, index) =>
      version(`doc${index}`, `doc${index}`),
    )
    const {client, fetch, listeners} = createMockClient(() => many)

    const settled = firstValueFrom(
      listenVersionInventory(client, ['product']).pipe(filter((source) => !source.loading)),
    )
    listeners[0]!.next({type: 'welcome'})
    const source = await settled

    expect(source.versions).toHaveLength(VERSION_INVENTORY_LIMIT)
    expect(source.truncated).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('_type in $types'),
      {types: ['product']},
      expect.objectContaining({perspective: 'raw'}),
    )
  })

  it('refetches when a version changes', async () => {
    let versions = [version('jacket', 'jacket')]
    const {client, listeners} = createMockClient(() => versions)
    const emissions: VersionInventorySource[] = []
    const subscription = listenVersionInventory(client, []).subscribe((source) =>
      emissions.push(source),
    )

    listeners[0]!.next({type: 'welcome'})
    await vi.waitFor(() => expect(emissions.at(-1)?.versions).toHaveLength(1))

    versions = [
      version('jacket', 'jacket'),
      version('drafts.jacket', 'jacket', {bundleId: 'drafts'}),
    ]
    listeners[0]!.next({type: 'mutation', transition: 'update', visibility: 'query'})
    await vi.waitFor(() => expect(emissions.at(-1)?.versions).toHaveLength(2))
    expect(emissions.at(-1)?.truncated).toBe(false)

    subscription.unsubscribe()
  })
})
