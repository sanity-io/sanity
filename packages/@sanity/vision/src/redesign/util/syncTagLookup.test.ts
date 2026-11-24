import {afterEach, describe, expect, it} from 'vitest'

import {
  clearSyncTagLookupCache,
  collectSyncTagCandidates,
  fetchSyncTagSourceMap,
  formatSyncTagMeaning,
  MAX_SYNC_TAG_PROBES,
  resolveSyncTags,
  type SyncTagLookupClient,
  type SyncTagSourceMap,
} from './syncTagLookup'

interface FakeDataset {
  anyTag: string
  types: Record<string, string>
  ids?: Record<string, string>
  slugs?: Record<string, string>
}

/** A client answering the probe queries with the tags the dataset would, and recording them */
function fakeClient(
  dataset: FakeDataset,
  config: {dataset?: string; perspective?: string | readonly string[]} = {},
  sourceMap?: SyncTagSourceMap,
) {
  const calls: {query: string; params: Record<string, unknown>}[] = []
  const client: SyncTagLookupClient = {
    config: () => ({projectId: 'p', dataset: 'd', apiHost: 'https://api', ...config}),
    fetch: async (query, params, options) => {
      calls.push({query, params})
      if (options.resultSourceMap) return {result: [], resultSourceMap: sourceMap}
      if (query === 'array::unique(*._type)') {
        return {result: Object.keys(dataset.types), syncTags: [dataset.anyTag]}
      }
      let tag: string | undefined
      if (params.type !== undefined) tag = dataset.types[String(params.type)]
      if (params.id !== undefined) tag = dataset.ids?.[String(params.id)]
      if (params.slug !== undefined) tag = dataset.slugs?.[String(params.slug)]
      return {result: 0, syncTags: tag ? [tag] : []}
    },
  }
  return {client, calls}
}

/** The params of the probes sent, without the one listing the types */
function probed(calls: {query: string; params: Record<string, unknown>}[]) {
  return calls.filter((call) => call.query.startsWith('count(')).map((call) => call.params)
}

const dataset: FakeDataset = {
  anyTag: 's1:any',
  types: {author: 's1:author', book: 's1:book', page: 's1:page'},
  ids: {'author-1': 's1:id-author-1'},
  slugs: {'about-us': 's1:slug-about'},
}

afterEach(() => clearSyncTagLookupCache())

describe('resolveSyncTags', () => {
  it('resolves the dataset-wide tag, types, ids and slugs', async () => {
    const {client} = fakeClient(dataset)
    const resolved = await resolveSyncTags(
      client,
      ['s1:any', 's1:book', 's1:id-author-1', 's1:slug-about'],
      {result: [{_id: 'author-1', _type: 'book', slug: {current: 'about-us'}}]},
    )
    expect(Object.fromEntries(resolved)).toEqual({
      's1:any': {kind: 'any'},
      's1:book': {kind: 'type', type: 'book'},
      's1:id-author-1': {kind: 'id', id: 'author-1'},
      's1:slug-about': {kind: 'slug', slug: 'about-us'},
    })
  })

  it('leaves out tags no probe answered with, and resolves the rest', async () => {
    const {client} = fakeClient(dataset)
    const resolved = await resolveSyncTags(client, ['s1:author', 's1:mystery'])
    expect(resolved.get('s1:author')).toEqual({kind: 'type', type: 'author'})
    expect(resolved.has('s1:mystery')).toBe(false)
  })

  describe('documents a query dereferences', () => {
    const withDocuments: FakeDataset = {
      ...dataset,
      ids: {
        'gen': 's1:id-gen',
        'drafts.gen': 's1:id-drafts-gen',
        'kind': 's1:id-kind',
        'drafts.kind': 's1:id-drafts-kind',
        'versions.r1.gen': 's1:id-r1-gen',
      },
    }
    const tags = ['s1:id-gen', 's1:id-drafts-gen', 's1:id-kind', 's1:id-drafts-kind']

    it('resolves the published and draft ids of documents only the source map lists', async () => {
      const {client} = fakeClient(withDocuments)
      const resolved = await resolveSyncTags(client, tags, {
        // The projection dereferences, so the result shows names and no ids
        result: [{generation: {name: 'one'}, types: ['a', 'b']}],
        sourceMap: {
          documents: [
            {_id: 'drafts.gen', _type: 'generation'},
            {_id: 'kind', _type: 'kind'},
          ],
        },
      })
      expect(Object.fromEntries(resolved)).toEqual({
        's1:id-gen': {kind: 'id', id: 'gen'},
        's1:id-drafts-gen': {kind: 'id', id: 'drafts.gen'},
        's1:id-kind': {kind: 'id', id: 'kind'},
        's1:id-drafts-kind': {kind: 'id', id: 'drafts.kind'},
      })
    })

    it('resolves them from the result’s references when there is no source map', async () => {
      const {client, calls} = fakeClient(withDocuments)
      const resolved = await resolveSyncTags(client, tags, {
        result: [{generation: {_ref: 'gen', _type: 'reference'}, types: [{_ref: 'kind'}]}],
      })
      expect(resolved.size).toBe(4)
      // No source map was asked for: every tag was found from the references
      expect(
        calls.some((call) => call.query !== 'array::unique(*._type)' && call.params.type),
      ).toBe(false)
    })

    it('fetches the source map once when the result shows too little, and probes what it lists', async () => {
      const {client, calls} = fakeClient(withDocuments, {}, undefined)
      let loads = 0
      const resolved = await resolveSyncTags(client, tags, {
        result: [{generation: {name: 'one'}}],
        loadSourceMap: async () => {
          loads++
          return {documents: [{_id: 'drafts.gen'}, {_id: 'drafts.kind'}]}
        },
      })
      expect(loads).toBe(1)
      expect(resolved.size).toBe(4)
      // The dataset's types were never swept: the loaded documents resolved every tag first
      expect(probed(calls).every((params) => 'id' in params)).toBe(true)
    })

    it('does not fetch the source map when the response carries one, or when nothing is left', async () => {
      const {client} = fakeClient(withDocuments)
      let loads = 0
      const loadSourceMap = async () => {
        loads++
        return undefined
      }
      await resolveSyncTags(client, ['s1:id-gen'], {
        result: [{_id: 'gen'}],
        loadSourceMap,
      })
      await resolveSyncTags(client, ['s1:id-kind', 's1:mystery'], {
        result: [],
        sourceMap: {documents: [{_id: 'kind'}]},
        loadSourceMap,
      })
      expect(loads).toBe(0)
    })

    it('still probes the dataset’s types when the source map cannot be fetched', async () => {
      const {client} = fakeClient(withDocuments)
      const resolved = await resolveSyncTags(client, ['s1:page'], {
        result: [],
        loadSourceMap: async () => {
          throw new Error('Network down')
        },
      })
      expect(resolved.get('s1:page')).toEqual({kind: 'type', type: 'page'})
    })

    it('probes the versions of a release in the perspective', async () => {
      const {client} = fakeClient(withDocuments, {perspective: ['r1', 'drafts']})
      const resolved = await resolveSyncTags(client, ['s1:id-r1-gen'], {
        result: [],
        sourceMap: {documents: [{_id: 'gen'}]},
      })
      expect(resolved.get('s1:id-r1-gen')).toEqual({kind: 'id', id: 'versions.r1.gen'})
    })
  })

  it('probes dereferenced ids, then types and slugs, then the ids a result shows, then other types', async () => {
    const {client, calls} = fakeClient({
      anyTag: 's1:any',
      types: {t1: 's1:t1', t2: 's1:t2', other: 's1:other'},
    })
    await resolveSyncTags(client, ['s1:never'], {
      result: [{_id: 'shown', _type: 't1', slug: {current: 'a-slug'}}],
      sourceMap: {documents: [{_id: 'deref', _type: 't2'}]},
    })
    const order = probed(calls).map((params) => Object.values(params)[0])
    const at = (value: string) => order.indexOf(value)
    // Each id is probed before the next, in its published, draft and version forms
    expect(order.slice(0, 2)).toEqual(['deref', 'drafts.deref'])
    expect(at('drafts.deref')).toBeLessThan(at('t2'))
    expect(at('t2')).toBeLessThan(at('shown'))
    expect(at('t1')).toBeLessThan(at('shown'))
    expect(at('a-slug')).toBeLessThan(at('shown'))
    expect(at('drafts.shown')).toBeLessThan(at('other'))
  })

  it('stops as soon as every tag is found', async () => {
    const types = Object.fromEntries(
      Array.from({length: MAX_SYNC_TAG_PROBES + 20}, (_, index) => [`t${index}`, `s1:t${index}`]),
    )
    const {client, calls} = fakeClient({anyTag: 's1:any', types, ids: {a: 's1:id-a'}})
    const resolved = await resolveSyncTags(client, ['s1:t15', 's1:id-a'], {
      result: [{_id: 'a', _type: 't15'}],
    })
    expect(resolved.size).toBe(2)
    // The four probes in flight may each send one more before the last answer lands
    expect(probed(calls).length).toBeLessThanOrEqual(2 + 4)
  })

  it('remembers the answers for the same client configuration', async () => {
    const first = fakeClient(dataset)
    await resolveSyncTags(first.client, ['s1:book'])
    const again = fakeClient(dataset)
    const resolved = await resolveSyncTags(again.client, ['s1:book'])
    expect(resolved.get('s1:book')).toEqual({kind: 'type', type: 'book'})
    expect(again.calls).toEqual([])

    const otherDataset = fakeClient(dataset, {dataset: 'other'})
    await resolveSyncTags(otherDataset.client, ['s1:book'])
    expect(otherDataset.calls.length).toBeGreaterThan(0)
  })

  it('asks about each probe once, however many candidates name it', async () => {
    const {client, calls} = fakeClient(dataset)
    await resolveSyncTags(client, ['s1:never'], {
      result: [{_id: 'x', _type: 'book', author: {_ref: 'x'}}],
      sourceMap: {documents: [{_id: 'x', _type: 'book'}]},
    })
    const keys = probed(calls).map((params) => JSON.stringify(params))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('ignores a probe answered with more or fewer than one tag', async () => {
    const {client} = fakeClient(dataset)
    const noisy: SyncTagLookupClient = {
      config: client.config,
      fetch: async (query, params, options) => {
        const response = await client.fetch(query, params, options)
        return params.type === 'book' ? {...response, syncTags: ['s1:book', 's1:extra']} : response
      },
    }
    const resolved = await resolveSyncTags(noisy, ['s1:book'])
    expect(resolved.has('s1:book')).toBe(false)
  })

  it('caps the number of probes at the named budget', async () => {
    expect(MAX_SYNC_TAG_PROBES).toBe(250)
    const types = Object.fromEntries(
      Array.from({length: MAX_SYNC_TAG_PROBES + 20}, (_, index) => [`t${index}`, `s1:t${index}`]),
    )
    const {client, calls} = fakeClient({anyTag: 's1:any', types})
    const resolved = await resolveSyncTags(client, ['s1:never'])
    expect(resolved.size).toBe(0)
    expect(probed(calls)).toHaveLength(MAX_SYNC_TAG_PROBES)
  })

  it('shares the budget between what the result shows and the source map', async () => {
    const ids = Array.from({length: 300}, (_, index) => `doc${index}`)
    const {client, calls} = fakeClient({anyTag: 's1:any', types: {}})
    await resolveSyncTags(client, ['s1:never'], {
      result: ids.map((_id) => ({_id})),
      loadSourceMap: async () => ({documents: ids.map((_id) => ({_id}))}),
    })
    expect(probed(calls)).toHaveLength(MAX_SYNC_TAG_PROBES)
  })

  it('rejects once aborted', async () => {
    const {client} = fakeClient(dataset)
    const controller = new AbortController()
    controller.abort()
    await expect(
      resolveSyncTags(client, ['s1:book'], {signal: controller.signal}),
    ).rejects.toThrow()
  })

  it('sends nothing without tags', async () => {
    const {client, calls} = fakeClient(dataset)
    expect((await resolveSyncTags(client, [])).size).toBe(0)
    expect(calls).toEqual([])
  })
})

describe('fetchSyncTagSourceMap', () => {
  it('asks for the source map of the query, without the CDN or a query echo', async () => {
    const map: SyncTagSourceMap = {documents: [{_id: 'a', _type: 'book'}]}
    const {client, calls} = fakeClient(dataset, {}, map)
    await expect(fetchSyncTagSourceMap(client, '*[0]{a->{b}}', {x: 1}, undefined)).resolves.toBe(
      map,
    )
    expect(calls).toEqual([{query: '*[0]{a->{b}}', params: {x: 1}}])
  })
})

describe('collectSyncTagCandidates', () => {
  it('collects types, ids and slugs at any depth, each once, in all their forms', () => {
    expect(
      collectSyncTagCandidates([
        {_id: 'a', _type: 'author', slug: {current: 'ada'}},
        {
          _id: 'b',
          _type: 'book',
          author: {_id: 'a', _type: 'author'},
          tags: [{slug: {current: 'x'}}],
        },
        'not a document',
        null,
      ]),
    ).toEqual({
      referencedIds: [],
      types: ['author', 'book'],
      ids: ['a', 'drafts.a', 'b', 'drafts.b'],
      slugs: ['ada', 'x'],
    })
  })

  it('takes the ids and types of the source map documents as dereferenced', () => {
    expect(
      collectSyncTagCandidates([{generation: {name: 'one'}}], {
        documents: [
          {_id: 'drafts.gen', _type: 'generation'},
          {_id: 'kind', _type: 'kind'},
          {_id: 'elsewhere', _type: 'remote', _projectId: 'other'},
        ],
      }),
    ).toEqual({
      referencedIds: ['drafts.gen', 'gen', 'kind', 'drafts.kind'],
      types: ['generation', 'kind'],
      ids: [],
      slugs: [],
    })
  })

  it('takes the targets of references as dereferenced when there is no source map', () => {
    expect(
      collectSyncTagCandidates({
        a: {_type: 'reference', _ref: 'gen'},
        b: [{_ref: 'kind', _weak: true}],
      }),
    ).toEqual({
      referencedIds: ['gen', 'drafts.gen', 'kind', 'drafts.kind'],
      // A reference's type is `reference`, which says nothing about its target
      types: [],
      ids: [],
      slugs: [],
    })
  })

  it('adds the published, draft and version forms of an id in both directions', () => {
    expect(
      collectSyncTagCandidates([{_id: 'a'}, {_id: 'drafts.b'}, {_id: 'versions.r1.c'}], undefined, {
        perspective: ['r2', 'drafts'],
      }).ids,
    ).toEqual([
      'a',
      'drafts.a',
      'versions.r2.a',
      'versions.r1.a',
      'drafts.b',
      'b',
      'versions.r2.b',
      'versions.r1.b',
      'versions.r1.c',
      'c',
      'drafts.c',
      'versions.r2.c',
    ])
  })

  it('keeps an `_originalId` as an id', () => {
    expect(collectSyncTagCandidates([{_id: 'a', _originalId: 'drafts.a'}]).ids.slice(0, 2)).toEqual(
      ['a', 'drafts.a'],
    )
  })

  it('reads nothing from a scalar result', () => {
    expect(collectSyncTagCandidates(42)).toEqual({
      referencedIds: [],
      types: [],
      ids: [],
      slugs: [],
    })
  })
})

describe('formatSyncTagMeaning', () => {
  it('writes each meaning as the GROQ filter it stands for', () => {
    expect(formatSyncTagMeaning({kind: 'any'})).toBe('*')
    expect(formatSyncTagMeaning({kind: 'type', type: 'book'})).toBe('_type == "book"')
    expect(formatSyncTagMeaning({kind: 'id', id: 'a"b'})).toBe('_id == "a\\"b"')
    expect(formatSyncTagMeaning({kind: 'slug', slug: 'about'})).toBe('slug.current == "about"')
  })
})
