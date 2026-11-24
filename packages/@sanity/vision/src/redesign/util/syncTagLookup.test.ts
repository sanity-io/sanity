import {afterEach, describe, expect, it} from 'vitest'

import {
  clearSyncTagLookupCache,
  collectSyncTagCandidates,
  formatSyncTagMeaning,
  MAX_SYNC_TAG_PROBES,
  resolveSyncTags,
  type SyncTagLookupClient,
} from './syncTagLookup'

interface FakeDataset {
  anyTag: string
  types: Record<string, string>
  ids?: Record<string, string>
  slugs?: Record<string, string>
}

/** A client answering the probe queries with the tags the dataset would, and recording them */
function fakeClient(dataset: FakeDataset, config: {dataset?: string} = {}) {
  const calls: {query: string; params: Record<string, string>}[] = []
  const client: SyncTagLookupClient = {
    config: () => ({projectId: 'p', dataset: 'd', apiHost: 'https://api', ...config}),
    fetch: async (query: string, params: Record<string, string>) => {
      calls.push({query, params})
      if (query === 'array::unique(*._type)') {
        return {result: Object.keys(dataset.types), syncTags: [dataset.anyTag]}
      }
      let tag: string | undefined
      if (params.type !== undefined) tag = dataset.types[params.type]
      if (params.id !== undefined) tag = dataset.ids?.[params.id]
      if (params.slug !== undefined) tag = dataset.slugs?.[params.slug]
      return {result: 0, syncTags: tag ? [tag] : []}
    },
  }
  return {client, calls}
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
      {candidates: {types: [], ids: ['author-1'], slugs: ['about-us']}},
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

  it('probes what the result shows before the other types, and stops once every tag is found', async () => {
    // More types than probes, so the result's id would never be reached after all of them
    const types = Object.fromEntries(
      Array.from({length: MAX_SYNC_TAG_PROBES + 20}, (_, index) => [`t${index}`, `s1:t${index}`]),
    )
    const {client, calls} = fakeClient({anyTag: 's1:any', types, ids: {a: 's1:id-a'}})
    const resolved = await resolveSyncTags(client, ['s1:t15', 's1:id-a'], {
      candidates: {types: ['t15'], ids: ['a'], slugs: []},
    })
    expect(Object.fromEntries(resolved)).toEqual({
      's1:t15': {kind: 'type', type: 't15'},
      's1:id-a': {kind: 'id', id: 'a'},
    })
    // The types listing, then the result's type and id; the four probes in flight may each send
    // one more before the last answer lands, but none of the other types after that
    expect(calls.slice(1, 3).map((call) => call.params)).toEqual([{type: 't15'}, {id: 'a'}])
    expect(calls.length).toBeLessThanOrEqual(1 + 2 * 4)
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

  it('caps the number of probes', async () => {
    const types = Object.fromEntries(
      Array.from({length: MAX_SYNC_TAG_PROBES + 20}, (_, index) => [`t${index}`, `s1:t${index}`]),
    )
    const {client, calls} = fakeClient({anyTag: 's1:any', types})
    const resolved = await resolveSyncTags(client, ['s1:never'])
    expect(resolved.size).toBe(0)
    expect(calls).toHaveLength(MAX_SYNC_TAG_PROBES + 1)
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

describe('collectSyncTagCandidates', () => {
  it('collects types, ids and slugs at any depth, each once', () => {
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
      types: ['author', 'book'],
      ids: ['a', 'b', 'drafts.a', 'drafts.b'],
      slugs: ['ada', 'x'],
    })
  })

  it('adds the draft of each published id, and keeps draft and version ids as they are', () => {
    expect(
      collectSyncTagCandidates([{_id: 'a', _originalId: 'drafts.a'}, {_id: 'versions.r1.b'}]).ids,
    ).toEqual(['a', 'drafts.a', 'versions.r1.b'])
  })

  it('reads nothing from a scalar result', () => {
    expect(collectSyncTagCandidates(42)).toEqual({types: [], ids: [], slugs: []})
  })

  it('samples a large array without exceeding the call stack', () => {
    const large = Array.from({length: 200_000}, (_, i) => ({_id: `doc-${i}`, _type: 'item'}))
    expect(() => collectSyncTagCandidates(large)).not.toThrow()
    const {ids, types} = collectSyncTagCandidates(large)
    expect(types).toEqual(['item'])
    expect(ids[0]).toBe('doc-0')
    expect(ids).toContain('drafts.doc-0')
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
