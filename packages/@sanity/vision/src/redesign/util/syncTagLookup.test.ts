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
import {MAX_TRACED_DOCUMENTS} from './syncTagQueryCandidates'

interface FakeDataset {
  anyTag: string
  types: Record<string, string>
  ids?: Record<string, string>
  slugs?: Record<string, string>
  /** What each trace query lists, by the query text; a trace it lacks fails */
  traces?: Record<string, unknown>
  /** The project's other datasets, by name */
  datasets?: Record<string, FakeDataset>
}

interface FakeCall {
  query: string
  params: Record<string, unknown>
  perspective: string | undefined
  dataset: string
}

/** A client answering the probe queries with the tags the dataset would, and recording them */
function fakeClient(
  dataset: FakeDataset,
  config: {dataset?: string; perspective?: string | readonly string[]} = {},
  sourceMap?: SyncTagSourceMap,
  calls: FakeCall[] = [],
) {
  const name = config.dataset ?? 'd'
  const client: SyncTagLookupClient = {
    config: () => ({projectId: 'p', dataset: 'd', apiHost: 'https://api', ...config}),
    fetch: async (query, params, options) => {
      calls.push({query, params, perspective: options.perspective, dataset: name})
      if (options.resultSourceMap) return {result: [], resultSourceMap: sourceMap}
      if (query === 'array::unique(*._type)') {
        return {result: Object.keys(dataset.types), syncTags: [dataset.anyTag]}
      }
      if (query.startsWith('array::unique(array::compact(')) {
        if (!dataset.traces || !(query in dataset.traces)) throw new Error('Trace failed')
        return {result: dataset.traces[query]}
      }
      let tag: string | undefined
      if (params.type !== undefined) tag = dataset.types[String(params.type)]
      if (params.id !== undefined) tag = dataset.ids?.[String(params.id)]
      if (params.slug !== undefined) tag = dataset.slugs?.[String(params.slug)]
      return {result: 0, syncTags: tag ? [tag] : []}
    },
    withConfig: (next) => {
      const other = dataset.datasets?.[next.dataset]
      if (!other) throw new Error(`No dataset ${next.dataset}`)
      return fakeClient(other, {...config, dataset: next.dataset}, undefined, calls).client
    },
  }
  return {client, calls}
}

/** The params of the probes sent, without the one listing the types */
function probed(calls: FakeCall[]) {
  return calls.filter((call) => call.query.startsWith('count(')).map((call) => call.params)
}

/** The ids the probes asked about, in order */
function probedIds(calls: FakeCall[]) {
  return probed(calls).flatMap((params) => (typeof params.id === 'string' ? [params.id] : []))
}

/** The trace queries sent, in order */
function traced(calls: FakeCall[]) {
  return calls.filter((call) => call.query.startsWith('array::unique(array::compact('))
}

const dataset: FakeDataset = {
  anyTag: 's1:any',
  types: {author: 's1:author', book: 's1:book', page: 's1:page'},
  ids: {'author-1': 's1:id-author-1'},
  slugs: {'about-us': 's1:slug-about'},
}

/** An image asset id the way the asset pipeline writes them */
function assetId(index: number): string {
  return `image-${index.toString(16).padStart(40, '0')}-1200x800-png`
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

  it('probes types and slugs, then dereferenced ids, then the ids a result shows, then other types', async () => {
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
    expect(order.slice(0, 3)).toEqual(['t2', 't1', 'a-slug'])
    // Each id is probed before the next, in its published, draft and version forms
    expect(order.slice(3, 5)).toEqual(['deref', 'drafts.deref'])
    expect(at('drafts.deref')).toBeLessThan(at('shown'))
    expect(at('drafts.shown')).toBeLessThan(at('other'))
  })

  it('finds a type tag at once when the result references more documents than the budget', async () => {
    const count = MAX_SYNC_TAG_PROBES
    const result = Array.from({length: count}, (_, index) => ({
      _type: 'creature',
      title: `Creature ${index}`,
      media: {_type: 'image', asset: {_type: 'reference', _ref: assetId(index)}},
    }))
    const sourceMap: SyncTagSourceMap = {
      documents: Array.from({length: count}, (_, index) => ({
        _id: `creature-${index}`,
        _type: 'creature',
      })),
    }
    const {client, calls} = fakeClient({
      anyTag: 's1:any',
      types: {'creature': 's1:creature', 'sanity.imageAsset': 's1:image-asset'},
    })
    const resolved = await resolveSyncTags(client, ['s1:creature'], {result, sourceMap})
    expect(resolved.get('s1:creature')).toEqual({kind: 'type', type: 'creature'})
    // The four probes in flight may each send one before the first answer lands
    expect(probed(calls).length).toBeLessThanOrEqual(4)
  })

  it('probes the draft and version forms of an asset reference like any other', async () => {
    // A query under a drafts or release perspective is tagged with those forms of every
    // document it dereferences, assets included, though an asset is only ever published
    const {client, calls} = fakeClient(dataset, {perspective: ['r1', 'drafts']})
    await resolveSyncTags(client, ['s1:never'], {
      result: [{image: {asset: {_ref: assetId(1)}}}],
    })
    expect(probedIds(calls)).toEqual([
      assetId(1),
      `drafts.${assetId(1)}`,
      `versions.r1.${assetId(1)}`,
    ])
  })

  describe('what the query writes out', () => {
    const withIds: FakeDataset = {
      ...dataset,
      ids: {'a': 's1:id-a', 'drafts.a': 's1:id-drafts-a', 'missing': 's1:id-missing'},
      slugs: {'no-such-page': 's1:slug-missing'},
    }

    it('probes the types, ids and slugs the query compares with, before what the result shows', async () => {
      const {client, calls} = fakeClient(withIds)
      const resolved = await resolveSyncTags(client, ['s1:id-missing', 's1:slug-missing'], {
        query: '*[_type == "page" && (_id == "missing" || slug.current == $slug)]{title}',
        params: {slug: 'no-such-page'},
        result: [],
      })
      expect(Object.fromEntries(resolved)).toEqual({
        's1:id-missing': {kind: 'id', id: 'missing'},
        's1:slug-missing': {kind: 'slug', slug: 'no-such-page'},
      })
      expect(probed(calls).slice(0, 3)).toEqual([
        {type: 'page'},
        {slug: 'no-such-page'},
        {id: 'missing'},
      ])
    })

    it('probes the draft and version forms of an id the query compares with', async () => {
      const {client, calls} = fakeClient(withIds, {perspective: ['r1', 'drafts']})
      const resolved = await resolveSyncTags(client, ['s1:id-drafts-a'], {
        query: '*[_id == $id]',
        params: {id: 'a'},
        result: [],
      })
      expect(resolved.get('s1:id-drafts-a')).toEqual({kind: 'id', id: 'drafts.a'})
      expect(probedIds(calls)).toEqual(['a', 'drafts.a', 'versions.r1.a'])
    })

    it('probes the draft and a version of a draft id as written, which a reference to a draft is read as', async () => {
      const {client, calls} = fakeClient(withIds, {perspective: ['r1']})
      await resolveSyncTags(client, ['s1:never'], {
        query: '*[_id == $id]',
        params: {id: 'drafts.a'},
        result: [],
      })
      expect(probedIds(calls).slice(0, 5)).toEqual([
        'drafts.a',
        'a',
        'drafts.drafts.a',
        'versions.r1.a',
        'versions.r1.drafts.a',
      ])
    })
  })

  describe('traces', () => {
    const query = '*[_type == "book"]{"n": author->name}'
    const trace =
      'array::unique(array::compact(*[_type == "book"]{"v": global::coalesce(author._dataset + ":" + author._ref, author._ref)}.v))[0...101]'
    const typeTrace =
      'array::unique(array::compact(*[_type == "book"]{"v": author->._type}.v))[0...101]'
    const missingTrace =
      'array::unique(array::compact(*[_type == "book"]{"v": select(!global::defined(author->._id) => global::coalesce(author._dataset + ":" + author._ref, author._ref))}.v))[0...101]'
    const withAuthors: FakeDataset = {
      ...dataset,
      ids: {'author-1': 's1:id-author-1', 'drafts.author-1': 's1:id-drafts-author-1'},
      traces: {[trace]: ['author-1'], [typeTrace]: ['author']},
    }

    it('lists the documents the query dereferences and probes them, when the result shows nothing', async () => {
      const {client, calls} = fakeClient(withAuthors, {perspective: 'drafts'})
      const resolved = await resolveSyncTags(client, ['s1:id-drafts-author-1'], {
        query,
        result: [{n: 'Ada'}],
      })
      expect(resolved.get('s1:id-drafts-author-1')).toEqual({kind: 'id', id: 'drafts.author-1'})
      expect(probedIds(calls)).toEqual(['author-1', 'drafts.author-1'])
    })

    it('evaluates a trace in the client’s perspective with the query’s params', async () => {
      const {client, calls} = fakeClient(withAuthors, {perspective: 'drafts'})
      await resolveSyncTags(client, ['s1:never'], {query, params: {x: 1}, result: []})
      expect(traced(calls)).toEqual([
        {query: trace, params: {x: 1}, perspective: undefined, dataset: 'd'},
        {query: typeTrace, params: {x: 1}, perspective: undefined, dataset: 'd'},
      ])
    })

    it('probes the types a dereference reaches before the documents', async () => {
      const {client, calls} = fakeClient(withAuthors)
      const resolved = await resolveSyncTags(client, ['s1:author'], {query, result: []})
      expect(resolved.get('s1:author')).toEqual({kind: 'type', type: 'author'})
      // The probes run a few at a time, so the first ids may already be on their way
      expect(probed(calls).slice(0, 2)).toEqual([{type: 'book'}, {type: 'author'}])
    })

    it('probes the documents of a trace that lists more than a response is tagged with one by one after every type', async () => {
      const many = Array.from({length: MAX_TRACED_DOCUMENTS + 1}, (_, index) => `author-${index}`)
      const {client, calls} = fakeClient({
        ...withAuthors,
        ids: {'author-7': 's1:id-author-7'},
        traces: {[trace]: many},
      })
      const resolved = await resolveSyncTags(client, ['s1:id-author-7'], {query, result: []})
      expect(resolved.get('s1:id-author-7')).toEqual({kind: 'id', id: 'author-7'})
      // The sweep of the dataset's types comes first; a few ids may be probed past the answer
      const ids = probedIds(calls)
      const order = probed(calls)
      expect(order.findIndex((params) => params.type === 'page')).toBeLessThan(
        order.findIndex((params) => params.id === ids[0]),
      )
      expect(ids.slice(0, 4)).toEqual([
        'author-0',
        'drafts.author-0',
        'author-1',
        'drafts.author-1',
      ])
      expect(ids).toContain('author-7')
      expect(ids.length).toBeLessThan(MAX_TRACED_DOCUMENTS)

      clearSyncTagLookupCache()
      const fewer = fakeClient({...withAuthors, traces: {[trace]: many.slice(1)}})
      await resolveSyncTags(fewer.client, ['s1:never'], {query, result: []})
      expect(probedIds(fewer.calls)).toHaveLength(MAX_TRACED_DOCUMENTS * 2)
      // Every document was read, so none is worth a trace of the ones that were not
      expect(traced(fewer.calls).map((call) => call.query)).not.toContain(missingTrace)
    })

    it('traces the references a long trace fails to read and probes them before the other types', async () => {
      const many = Array.from({length: MAX_TRACED_DOCUMENTS + 1}, (_, index) => `author-${index}`)
      const {client, calls} = fakeClient({
        ...withAuthors,
        ids: {'drafts.gone': 's1:id-drafts-gone', 'drafts.drafts.gone': 's1:id-drafts-drafts-gone'},
        traces: {[trace]: many, [missingTrace]: ['drafts.gone']},
      })
      const resolved = await resolveSyncTags(
        client,
        ['s1:id-drafts-gone', 's1:id-drafts-drafts-gone'],
        {query, result: []},
      )
      expect(Object.fromEntries(resolved)).toEqual({
        's1:id-drafts-gone': {kind: 'id', id: 'drafts.gone'},
        's1:id-drafts-drafts-gone': {kind: 'id', id: 'drafts.drafts.gone'},
      })
      expect(traced(calls).map((call) => call.query)).toEqual([trace, typeTrace, missingTrace])
      // The references that read nothing, in every form, before the sweep of the other types
      expect(probedIds(calls).slice(0, 3)).toEqual(['drafts.gone', 'gone', 'drafts.drafts.gone'])
      expect(probed(calls).some((params) => params.type === 'page')).toBe(false)
    })

    it('probes the first documents of a long trace before anything else for a sliced query', async () => {
      const sliced = '*[_type == "book" && author->name == "Ada"][0...2]{_id}'
      const slicedTrace =
        'array::unique(array::compact(*[_type == "book"]{"v": global::coalesce(author._dataset + ":" + author._ref, author._ref)}.v))[0...101]'
      const slicedMissing =
        'array::unique(array::compact(*[_type == "book"]{"v": select(!global::defined(author->._id) => global::coalesce(author._dataset + ":" + author._ref, author._ref))}.v))[0...101]'
      const many = Array.from({length: MAX_TRACED_DOCUMENTS + 1}, (_, index) => `author-${index}`)
      const {client, calls} = fakeClient({
        ...withAuthors,
        ids: {'author-1': 's1:id-author-1'},
        traces: {[slicedTrace]: many, [slicedMissing]: ['gone']},
      })
      const resolved = await resolveSyncTags(client, ['s1:id-author-1'], {
        query: sliced,
        result: [],
      })
      expect(resolved.get('s1:id-author-1')).toEqual({kind: 'id', id: 'author-1'})
      // The request stopped at the second book, so it is tagged with the first authors it read:
      // those come before the references it failed to read and before the other types
      expect(probedIds(calls).slice(0, 4)).toEqual([
        'author-0',
        'drafts.author-0',
        'author-1',
        'drafts.author-1',
      ])
      expect(probedIds(calls)).not.toContain('gone')
      expect(probed(calls).some((params) => params.type === 'page')).toBe(false)
    })

    it('does not trace when the query’s literals and the result resolve every tag', async () => {
      const {client, calls} = fakeClient(withAuthors)
      await resolveSyncTags(client, ['s1:book'], {query, result: [{n: 'Ada'}]})
      expect(traced(calls)).toEqual([])
    })

    it('remembers a trace’s answer for the same client, perspective, query and params', async () => {
      const first = fakeClient(withAuthors, {perspective: 'drafts'})
      await resolveSyncTags(first.client, ['s1:never'], {query, result: []})
      const again = fakeClient(withAuthors, {perspective: 'drafts'})
      await resolveSyncTags(again.client, ['s1:never'], {query, result: []})
      expect(traced(again.calls)).toEqual([])

      const published = fakeClient(withAuthors, {perspective: 'published'})
      await resolveSyncTags(published.client, ['s1:never'], {query, result: []})
      expect(traced(published.calls)).toHaveLength(2)
    })

    it('goes on without a trace that fails', async () => {
      const {client} = fakeClient({...withAuthors, traces: {}})
      const resolved = await resolveSyncTags(client, ['s1:book'], {query, result: []})
      expect(resolved.get('s1:book')).toEqual({kind: 'type', type: 'book'})
    })

    it('rejects when aborted while tracing', async () => {
      const controller = new AbortController()
      const {client} = fakeClient({
        ...withAuthors,
        traces: {
          get [trace]() {
            controller.abort()
            throw new Error('Aborted')
          },
        },
      })
      await expect(
        resolveSyncTags(client, ['s1:never'], {query, result: [], signal: controller.signal}),
      ).rejects.toThrow()
    })
  })

  describe('cross-dataset references', () => {
    const withOther: FakeDataset = {
      ...dataset,
      datasets: {other: {anyTag: 's1:other-any', types: {remote: 's1:remote'}}},
    }

    it('resolves the tag of another dataset the source map names, by asking that dataset', async () => {
      const {client, calls} = fakeClient(withOther)
      const resolved = await resolveSyncTags(client, ['s1:other-any'], {
        result: [{n: 'remote'}],
        sourceMap: {
          documents: [
            {_id: 'r', _type: 'remote', _projectId: 'p', _dataset: 'other'},
            {_id: 's', _type: 'remote', _projectId: 'elsewhere', _dataset: 'other'},
          ],
        },
      })
      expect(resolved.get('s1:other-any')).toEqual({kind: 'dataset', dataset: 'other'})
      expect(calls.filter((call) => call.dataset === 'other')).toEqual([
        {query: 'array::unique(*._type)', params: {}, perspective: 'raw', dataset: 'other'},
      ])
    })

    it('resolves it from a cross-dataset reference the result shows', async () => {
      const {client, calls} = fakeClient(withOther)
      const resolved = await resolveSyncTags(client, ['s1:other-any'], {
        result: [{book: {_ref: 'r', _dataset: 'other', _projectId: 'p'}}],
      })
      expect(resolved.get('s1:other-any')).toEqual({kind: 'dataset', dataset: 'other'})
      // The reference's id is a document of the other dataset, not one to probe here
      expect(probedIds(calls)).toEqual([])
    })

    it('resolves it from a trace that lists the reference with its dataset', async () => {
      const trace =
        'array::unique(array::compact(*[_type == "book"]{"v": global::coalesce(author._dataset + ":" + author._ref, author._ref)}.v))[0...101]'
      const {client, calls} = fakeClient({...withOther, traces: {[trace]: ['other:r']}})
      const resolved = await resolveSyncTags(client, ['s1:other-any'], {
        query: '*[_type == "book"]{"n": author->name}',
        result: [{n: 'remote'}],
      })
      expect(resolved.get('s1:other-any')).toEqual({kind: 'dataset', dataset: 'other'})
      expect(probedIds(calls)).toEqual([])
    })

    it('goes on when the other dataset cannot be asked', async () => {
      const {client} = fakeClient(dataset)
      const resolved = await resolveSyncTags(client, ['s1:book'], {
        result: [{_type: 'book', book: {_ref: 'r', _dataset: 'unknown'}}],
      })
      expect(resolved.get('s1:book')).toEqual({kind: 'type', type: 'book'})
      const noWithConfig: SyncTagLookupClient = {config: client.config, fetch: client.fetch}
      clearSyncTagLookupCache()
      await expect(
        resolveSyncTags(noWithConfig, ['s1:book'], {
          result: [{_type: 'book', book: {_ref: 'r', _dataset: 'other'}}],
        }),
      ).resolves.toHaveProperty('size', 1)
    })
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
    expect(calls).toEqual([
      {query: '*[0]{a->{b}}', params: {x: 1}, perspective: undefined, dataset: 'd'},
    ])
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
      datasets: [],
    })
  })

  it('takes the ids and types of the source map documents as dereferenced', () => {
    expect(
      collectSyncTagCandidates(
        [{generation: {name: 'one'}}],
        {
          documents: [
            {_id: 'drafts.gen', _type: 'generation'},
            {_id: 'kind', _type: 'kind'},
            {_id: 'elsewhere', _type: 'remote', _projectId: 'other', _dataset: 'theirs'},
            {_id: 'nearby', _type: 'remote', _projectId: 'p', _dataset: 'ours'},
          ],
        },
        {projectId: 'p'},
      ),
    ).toEqual({
      referencedIds: ['drafts.gen', 'gen', 'drafts.drafts.gen', 'kind', 'drafts.kind'],
      types: ['generation', 'kind'],
      ids: [],
      slugs: [],
      // Another project's dataset is not one the client can ask about
      datasets: ['ours'],
    })
  })

  it('takes the targets of references as dereferenced when there is no source map', () => {
    expect(
      collectSyncTagCandidates({
        a: {_type: 'reference', _ref: 'gen'},
        b: [{_ref: 'kind', _weak: true}],
        c: {_type: 'crossDatasetReference', _ref: 'far', _dataset: 'ours', _projectId: 'p'},
      }),
    ).toEqual({
      referencedIds: ['gen', 'drafts.gen', 'kind', 'drafts.kind'],
      // A reference's type is `reference`, which says nothing about its target
      types: [],
      ids: [],
      slugs: [],
      datasets: ['ours'],
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
      // A reference written to a draft is read as the draft and a version of the id as written
      'drafts.drafts.b',
      'versions.r2.b',
      'versions.r2.drafts.b',
      'versions.r1.b',
      'versions.r1.drafts.b',
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
      datasets: [],
    })
  })
})

describe('formatSyncTagMeaning', () => {
  it('writes each meaning as the GROQ filter it stands for', () => {
    expect(formatSyncTagMeaning({kind: 'any'})).toBe('*')
    expect(formatSyncTagMeaning({kind: 'type', type: 'book'})).toBe('_type == "book"')
    expect(formatSyncTagMeaning({kind: 'id', id: 'a"b'})).toBe('_id == "a\\"b"')
    expect(formatSyncTagMeaning({kind: 'slug', slug: 'about'})).toBe('slug.current == "about"')
    expect(formatSyncTagMeaning({kind: 'dataset', dataset: 'other'})).toBe('* in dataset "other"')
  })
})
