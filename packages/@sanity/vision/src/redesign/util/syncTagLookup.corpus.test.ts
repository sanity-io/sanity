import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {afterEach, describe, expect, it} from 'vitest'

import {clearSyncTagLookupCache, resolveSyncTags, type SyncTagLookupClient} from './syncTagLookup'

/**
 * A corpus of generated queries, one per query shape and dataset, run against the test studio's
 * datasets: the tags each response carried, what the lookup's trace queries listed, and the tag
 * each probe answered with. Replaying them offline checks that the lookup still resolves every
 * tag, and with the probes recorded. A change to the trace queries the lookup asks (their text
 * is the key) needs the corpus re-recorded against the API, which is what an unrecorded trace
 * failing below says.
 */
interface RecordedDataset {
  anyTag?: string
  allTypes: string[]
  types: Record<string, string>
  ids: Record<string, string>
  slugs: Record<string, string>
}

interface RecordedQuery {
  shape: string
  dataset: string
  perspective: string | string[]
  query: string
  params: Record<string, unknown>
  /** Pruned to the keys the lookup reads; absent when the result was a scalar */
  result?: unknown
  tags: string[]
  traces: Record<string, unknown>
  /** The lookup's answer when recorded, as `SyncTagMeaning`s */
  meanings: Record<string, Record<string, string> | null>
}

const corpus: {datasets: Record<string, RecordedDataset>; queries: RecordedQuery[]} = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'syncTagCorpus.fixture.json'),
    'utf8',
  ),
)
const {datasets, queries} = corpus

const TYPES_QUERY = 'array::unique(*._type)'
const TRACE_PREFIX = 'array::unique(array::compact('

function recordedClient(entry: RecordedQuery) {
  const unrecordedTraces: string[] = []
  let probes = 0
  const clientFor = (name: string): SyncTagLookupClient => {
    const dataset = datasets[name]
    if (!dataset) throw new Error(`Dataset ${name} is not in the corpus`)
    return {
      config: () => ({
        projectId: 'p',
        dataset: name,
        apiHost: 'https://api',
        perspective: entry.perspective,
      }),
      fetch: async (query, params) => {
        if (query === TYPES_QUERY) {
          return {result: dataset.allTypes, syncTags: dataset.anyTag ? [dataset.anyTag] : []}
        }
        if (query.startsWith(TRACE_PREFIX)) {
          if (!(query in entry.traces)) {
            unrecordedTraces.push(query)
            throw new Error(`Trace not recorded: ${query}`)
          }
          return {result: entry.traces[query]}
        }
        probes++
        let tag: string | undefined
        if (typeof params.type === 'string') tag = dataset.types[params.type]
        if (typeof params.id === 'string') tag = dataset.ids[params.id]
        if (typeof params.slug === 'string') tag = dataset.slugs[params.slug]
        return {result: 0, syncTags: tag ? [tag] : []}
      },
      withConfig: (config) => clientFor(config.dataset),
    }
  }
  return {client: clientFor(entry.dataset), unrecordedTraces, probes: () => probes}
}

afterEach(() => clearSyncTagLookupCache())

describe('resolveSyncTags on the fuzz corpus', () => {
  it('covers every query shape of the corpus once per dataset', () => {
    const seen = new Set<string>()
    for (const entry of queries) {
      const key = `${entry.dataset}/${entry.shape}`
      expect(seen.has(key), `${key} recorded twice`).toBe(false)
      seen.add(key)
      expect(entry.tags.length).toBeGreaterThan(0)
    }
    expect(new Set(queries.map((entry) => entry.shape)).size).toBeGreaterThan(50)
  })

  it.each(queries.map((entry) => [`${entry.dataset} ${entry.shape}`, entry] as const))(
    'resolves every tag of %s',
    async (_name, entry) => {
      const {client, unrecordedTraces} = recordedClient(entry)
      const resolved = await resolveSyncTags(client, entry.tags, {
        query: entry.query,
        params: entry.params,
        result: entry.result,
      })
      expect(unrecordedTraces).toEqual([])
      expect(Object.fromEntries(resolved)).toEqual(entry.meanings)
      for (const tag of entry.tags) expect(resolved.get(tag), tag).toBeDefined()
    },
  )
})
