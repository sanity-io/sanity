import {
  collectQuerySyncTagCandidates,
  flattenTraceValues,
  MAX_TRACED_DOCUMENTS,
  type SyncTagTrace,
  TRACED_DATASET_SEPARATOR,
} from './syncTagQueryCandidates'

/** What a sync tag stands for: the documents whose changes invalidate a response carrying it */
export type SyncTagMeaning =
  | {kind: 'any'}
  | {kind: 'type'; type: string}
  | {kind: 'id'; id: string}
  | {kind: 'slug'; slug: string}
  /** Any document of another dataset of the project, read through a cross-dataset reference */
  | {kind: 'dataset'; dataset: string}

interface FetchOptions {
  filterResponse: false
  /** Every document as stored, so a filter on one id matches that document alone */
  perspective?: 'raw'
  /** The probes need the studio's credentials, which the API CDN never receives */
  useCdn: false
  returnQuery: false
  resultSourceMap: boolean
  stega: false
  tag: string
  signal: AbortSignal | undefined
}

/** The documents of a response's `resultSourceMap`, which lists every document a result reads */
export interface SyncTagSourceMap {
  documents?: readonly {_id: string; _type?: string; _projectId?: string; _dataset?: string}[]
}

interface ProbeResponse {
  result: unknown
  syncTags?: readonly string[]
  resultSourceMap?: SyncTagSourceMap
}

/** The client calls the lookup makes; a `SanityClient` has them */
export interface SyncTagLookupClient {
  config(): {
    projectId?: string
    dataset?: string
    apiHost?: string
    apiVersion?: string
    perspective?: string | readonly string[]
  }
  fetch(
    query: string,
    params: Record<string, unknown>,
    options: FetchOptions,
  ): Promise<ProbeResponse>
  /** The same client on another dataset, for the tag of a cross-dataset reference's target */
  withConfig?(config: {dataset: string}): SyncTagLookupClient
}

/** Values from the response that its tags may have been computed from */
export interface SyncTagCandidates {
  /**
   * Documents the result reads without showing their ids, as a `->` does: those in its source
   * map, and the targets of its references. Each in its published, draft and version forms.
   */
  referencedIds: string[]
  types: string[]
  slugs: string[]
  /** Documents the result shows by `_id`, each in its published, draft and version forms */
  ids: string[]
  /** Other datasets of the project the result reads through cross-dataset references */
  datasets: string[]
}

/** Probe queries one lookup sends at most, past the one listing the dataset's types */
export const MAX_SYNC_TAG_PROBES = 250
const PROBE_CONCURRENCY = 4
/** Nodes of the result read for candidates; a large result is sampled from its start */
const MAX_RESULT_NODES = 5_000

const TYPES_QUERY = 'array::unique(*._type)'
const DRAFTS_PREFIX = 'drafts.'
const VERSIONS_PREFIX = 'versions.'
/** Perspective names that are not releases */
const RESERVED_PERSPECTIVES = new Set(['published', 'drafts', 'raw', 'previewDrafts'])
/** Trace queries evaluated at once */
const TRACE_CONCURRENCY = 4
/** Trace answers kept, over every client configuration */
const MAX_CACHED_TRACES = 200

interface Probe {
  key: string
  meaning: SyncTagMeaning
  query: string
  params: Record<string, string>
  /** The dataset to ask, when it is not the client's own */
  dataset?: string
}

function typeProbe(type: string): Probe {
  return {
    key: `type:${type}`,
    meaning: {kind: 'type', type},
    query: 'count(*[_type == $type])',
    params: {type},
  }
}

function idProbe(id: string): Probe {
  return {
    key: `id:${id}`,
    meaning: {kind: 'id', id},
    query: 'count(*[_id == $id])',
    params: {id},
  }
}

function slugProbe(slug: string): Probe {
  return {
    key: `slug:${slug}`,
    meaning: {kind: 'slug', slug},
    query: 'count(*[slug.current == $slug])',
    params: {slug},
  }
}

/**
 * The tag that covers another dataset of the project: a document read through a cross-dataset
 * reference tags the response with the whole of its dataset, not with the document.
 */
function datasetProbe(dataset: string): Probe {
  return {
    key: `dataset:${dataset}`,
    meaning: {kind: 'dataset', dataset},
    query: TYPES_QUERY,
    params: {},
    dataset,
  }
}

/**
 * The tag each probe answered with, per client configuration: a tag is a hash of the filter and
 * the dataset it ran on, the same whatever perspective a query is sent with.
 * `null` records a probe that answered with no single tag.
 */
const probeCache = new Map<string, Map<string, string | null>>()
const typesCache = new Map<string, {anyTag: string | undefined; types: string[]}>()
/** The values each trace listed, per client configuration, perspective, query and params */
const traceCache = new Map<string, string[]>()

function cacheKey(client: SyncTagLookupClient): string {
  const {projectId, dataset, apiHost, apiVersion} = client.config()
  return JSON.stringify([projectId, dataset, apiHost, apiVersion])
}

/** Forgets every probe answer; for tests */
export function clearSyncTagLookupCache(): void {
  probeCache.clear()
  typesCache.clear()
  traceCache.clear()
}

async function fetchProbe(
  client: SyncTagLookupClient,
  query: string,
  params: Record<string, string>,
  signal: AbortSignal | undefined,
): Promise<ProbeResponse> {
  return client.fetch(query, params, {
    filterResponse: false,
    perspective: 'raw',
    useCdn: false,
    returnQuery: false,
    resultSourceMap: false,
    stega: false,
    tag: 'vision.sync-tags',
    signal,
  })
}

/**
 * The `resultSourceMap` of a query, fetched with the options the lookup's probes use. A result
 * carries it only when the request asked for it, and without it a result that dereferences with
 * `->` does not show which documents it read.
 */
export async function fetchSyncTagSourceMap(
  client: SyncTagLookupClient,
  query: string,
  params: Record<string, unknown>,
  signal: AbortSignal | undefined,
): Promise<SyncTagSourceMap | undefined> {
  const response = await client.fetch(query, params, {
    filterResponse: false,
    useCdn: false,
    returnQuery: false,
    resultSourceMap: true,
    stega: false,
    tag: 'vision.sync-tags',
    signal,
  })
  return response.resultSourceMap
}

/** Releases a perspective stack names, whose versions a query may read */
function releasesOfPerspective(perspective: string | readonly string[] | undefined): string[] {
  const stack = typeof perspective === 'string' ? [perspective] : (perspective ?? [])
  return stack.filter((name) => !RESERVED_PERSPECTIVES.has(name))
}

/** The id of the published document an id stands for, and the release when it is a version's */
function parseDocumentId(id: string): {publishedId: string; release: string | undefined} {
  if (id.startsWith(DRAFTS_PREFIX))
    return {publishedId: id.slice(DRAFTS_PREFIX.length), release: undefined}
  if (id.startsWith(VERSIONS_PREFIX)) {
    const rest = id.slice(VERSIONS_PREFIX.length)
    const dot = rest.indexOf('.')
    if (dot > 0) return {publishedId: rest.slice(dot + 1), release: rest.slice(0, dot)}
  }
  return {publishedId: id, release: undefined}
}

/**
 * Each id as it is, then the other forms of the same document: the published id, the draft and
 * a version in each release the ids or the perspective name. A query reads whichever form its
 * perspective picks, and its tags cover them all, so one form being listed tells nothing about
 * which of the others the tag was computed from. That holds for assets too: an asset is only
 * ever published, but a query under the drafts perspective is tagged with the draft of every
 * document it dereferences, assets included.
 */
function expandIds(ids: readonly string[], perspectiveReleases: readonly string[]): string[] {
  const releases = new Set(perspectiveReleases)
  for (const id of ids) {
    const {release} = parseDocumentId(id)
    if (release) releases.add(release)
  }
  const expanded = new Set<string>()
  for (const id of ids) {
    expanded.add(id)
    const {publishedId} = parseDocumentId(id)
    expanded.add(publishedId)
    expanded.add(`${DRAFTS_PREFIX}${publishedId}`)
    // A reference written with the draft prefix is also read as the draft, and as a version in
    // each release, of the id as written
    if (id.startsWith(DRAFTS_PREFIX)) expanded.add(`${DRAFTS_PREFIX}${id}`)
    for (const release of releases) {
      expanded.add(`${VERSIONS_PREFIX}${release}.${publishedId}`)
      if (id.startsWith(DRAFTS_PREFIX)) expanded.add(`${VERSIONS_PREFIX}${release}.${id}`)
    }
  }
  return [...expanded]
}

export interface CollectSyncTagCandidatesOptions {
  /** The perspective stack's releases, for the versions of each document to probe */
  perspective?: string | readonly string[]
  /** The project queried, whose other datasets a cross-dataset reference may read */
  projectId?: string
}

/**
 * The dataset a reference or a source map document names when it is another of the same
 * project: a document of another project is not one the client can ask about.
 */
function otherDataset(
  record: {_projectId?: unknown; _dataset?: unknown},
  projectId: string | undefined,
): string | undefined {
  const {_dataset: dataset, _projectId: project} = record
  if (typeof dataset !== 'string' || !dataset) return undefined
  if (projectId && typeof project === 'string' && project && project !== projectId) {
    return undefined
  }
  return dataset
}

/**
 * The `_type`s, `_id`s and `slug.current`s a query result and its source map show, each once and
 * in the order they appear, the ids it only points to, and the other datasets it reads. A result
 * that dereferences does not show the documents it read, but its source map lists them, and its
 * `_ref`s name the same documents when there is no source map. Those are the likeliest sources
 * of its tags.
 */
export function collectSyncTagCandidates(
  result: unknown,
  sourceMap?: SyncTagSourceMap,
  options: CollectSyncTagCandidatesOptions = {},
): SyncTagCandidates {
  const types = new Set<string>()
  const ids = new Set<string>()
  const refs = new Set<string>()
  const sourceMapIds = new Set<string>()
  const slugs = new Set<string>()
  const datasets = new Set<string>()

  for (const document of sourceMap?.documents ?? []) {
    const dataset = otherDataset(document, options.projectId)
    if (dataset) {
      datasets.add(dataset)
      continue
    }
    // A document of another project is not one a probe here can find
    if (document._projectId || document._dataset) continue
    if (typeof document._id === 'string' && document._id) sourceMapIds.add(document._id)
    if (typeof document._type === 'string' && document._type) types.add(document._type)
  }

  const queue: unknown[] = [result]
  let visited = 0
  // Index walk: `shift()` is O(n) per step and `push(...huge)` overflows the call stack
  for (let head = 0; head < queue.length && visited < MAX_RESULT_NODES; head++) {
    const node = queue[head]
    visited++
    if (Array.isArray(node)) {
      // Only enqueue what the visit budget can still take
      const room = MAX_RESULT_NODES - visited
      for (let index = 0; index < node.length && index < room; index++) {
        queue.push(node[index])
      }
      continue
    }
    if (!node || typeof node !== 'object') continue
    const record = node as Record<string, unknown>
    if (typeof record._ref === 'string' && record._ref) {
      const dataset = otherDataset(record, options.projectId)
      if (dataset) datasets.add(dataset)
      else if (!record._dataset && !record._projectId) refs.add(record._ref)
    }
    // A reference's `_type` is `reference`, which says nothing about the document it points to
    else if (typeof record._type === 'string' && record._type) types.add(record._type)
    for (const id of [record._id, record._originalId]) {
      if (typeof id === 'string' && id) ids.add(id)
    }
    const slug = record.slug
    if (slug && typeof slug === 'object' && !Array.isArray(slug)) {
      const current = (slug as Record<string, unknown>).current
      if (typeof current === 'string' && current) slugs.add(current)
    }
    for (const value of Object.values(record)) {
      if (value && typeof value === 'object') queue.push(value)
    }
  }

  const releases = releasesOfPerspective(options.perspective)
  return {
    // The source map is exact; the references are what a result without one still reveals
    referencedIds: expandIds([...sourceMapIds, ...refs], releases),
    types: [...types],
    slugs: [...slugs],
    ids: expandIds([...ids], releases),
    datasets: [...datasets],
  }
}

export interface ResolveSyncTagsOptions {
  /** The query the tags came with, read for what it compares and dereferences */
  query?: string
  /** The params the query ran with, for the values it compares and for its traces */
  params?: Record<string, unknown>
  /** The result the tags came with, read for the documents they may stand for */
  result?: unknown
  /** The result's `resultSourceMap`, when the request asked for it */
  sourceMap?: SyncTagSourceMap
  /**
   * Fetches the source map when the request did not ask for it, and some tags are still
   * unresolved after probing what the result itself shows
   */
  loadSourceMap?: (signal: AbortSignal | undefined) => Promise<SyncTagSourceMap | undefined>
  signal?: AbortSignal
}

/**
 * Evaluates a trace query the way the request ran: with its params and in its perspective, so
 * the documents it lists are the ones the request dereferenced and the values it compared.
 */
async function fetchTrace(
  client: SyncTagLookupClient,
  trace: SyncTagTrace,
  params: Record<string, unknown>,
  signal: AbortSignal | undefined,
): Promise<string[]> {
  const {perspective} = client.config()
  const key = JSON.stringify([cacheKey(client), perspective, trace.query, params])
  const cached = traceCache.get(key)
  if (cached) return cached
  const response = await client.fetch(trace.query, params, {
    filterResponse: false,
    useCdn: false,
    returnQuery: false,
    resultSourceMap: false,
    stega: false,
    tag: 'vision.sync-tags',
    signal,
  })
  const values = flattenTraceValues(response.result)
  if (traceCache.size >= MAX_CACHED_TRACES) {
    const oldest = traceCache.keys().next().value
    if (oldest !== undefined) traceCache.delete(oldest)
  }
  traceCache.set(key, values)
  return values
}

/**
 * The ids an id trace lists, which are of this dataset's documents; the dataset of each
 * cross-dataset reference, which the trace lists as `dataset:id`, goes into `datasets`
 */
function listedDocuments(values: readonly string[], datasets: string[]): string[] {
  const documents: string[] = []
  for (const value of values) {
    const separator = value.indexOf(TRACED_DATASET_SEPARATOR)
    if (separator === -1) documents.push(value)
    else if (separator > 0) datasets.push(value.slice(0, separator))
  }
  return documents
}

interface TraceCandidates {
  candidates: SyncTagCandidates
  /**
   * The documents of the traces that list more than a response is tagged with one by one, in
   * the order the traces list them: the order the request read them in, when it read some
   */
  overflow: string[]
  /** The references those traces fail to read, which no type stands in for */
  missing: string[]
}

/**
 * The values the query's traces list, as candidates: the ids of the documents it dereferenced
 * and whatever its comparisons computed. A trace that fails is left out, since the rest may
 * still answer; an abort ends the lookup.
 */
async function traceCandidates(
  client: SyncTagLookupClient,
  traces: readonly SyncTagTrace[],
  params: Record<string, unknown>,
  releases: readonly string[],
  signal: AbortSignal | undefined,
): Promise<TraceCandidates> {
  const ids: string[] = []
  const overflow: string[] = []
  const missing: string[] = []
  const types: string[] = []
  const slugs: string[] = []
  const datasets: string[] = []
  const queue = [...traces]
  const worker = async () => {
    while (queue.length > 0) {
      signal?.throwIfAborted()
      const trace = queue.shift()!
      let values: string[]
      try {
        values = await fetchTrace(client, trace, params, signal)
      } catch {
        signal?.throwIfAborted()
        continue
      }
      if (trace.kind === 'type') types.push(...values)
      else if (trace.kind === 'slug') slugs.push(...values)
      else {
        const documents = listedDocuments(values, datasets)
        if (documents.length <= MAX_TRACED_DOCUMENTS) {
          ids.push(...documents)
          continue
        }
        // A response that dereferences more documents than it is tagged with one by one is
        // tagged with their types, which the trace of those lists, and still with the id of
        // each document it failed to read, which has no type: those are worth a trace of their
        // own. A sliced request may also have stopped reading early and be tagged with the
        // first documents the trace lists. Both are kept for whatever budget the likelier
        // probes leave
        overflow.push(...documents)
        if (trace.missingQuery) {
          try {
            const unread = await fetchTrace(
              client,
              {kind: 'id', query: trace.missingQuery},
              params,
              signal,
            )
            missing.push(...listedDocuments(unread, datasets))
          } catch {
            signal?.throwIfAborted()
          }
        }
      }
    }
  }
  await Promise.all(Array.from({length: TRACE_CONCURRENCY}, worker))
  return {
    candidates: {referencedIds: expandIds(ids, releases), types, slugs, ids: [], datasets},
    overflow,
    missing,
  }
}

/**
 * Finds what each tag stands for by asking the API for the tags of queries whose meaning is
 * known: the list of every type (whose tag covers the whole dataset), then one count per type,
 * id and slug, until every tag is found or the probes run out.
 *
 * The probes go in the order a tag is most likely found within the budget: the types, slugs and
 * ids the query writes out or takes as params and the result shows, the documents the result
 * dereferences (source map, then `_ref`s), the ids it shows, then what the query's traces list
 * (the documents it dereferences without showing them, in a filter, an `order()`, a `count()`
 * or a dereferenced document, and the values its comparisons compute), and last the dataset's
 * other types and the documents of a trace too long for a response to be tagged with one by
 * one: those a sliced query read first, or those a query reading everything failed to read.
 * Without a source map, `loadSourceMap` is asked for one once none of that has resolved
 * everything. A tag no probe answered with is left out of the map.
 */
export async function resolveSyncTags(
  client: SyncTagLookupClient,
  tags: readonly string[],
  options: ResolveSyncTagsOptions = {},
): Promise<Map<string, SyncTagMeaning>> {
  const {query, params = {}, result, sourceMap, loadSourceMap, signal} = options
  const resolved = new Map<string, SyncTagMeaning>()
  const remaining = new Set(tags)
  if (remaining.size === 0) return resolved

  const key = cacheKey(client)
  let known = typesCache.get(key)
  if (!known) {
    const response = await fetchProbe(client, TYPES_QUERY, {}, signal)
    const types = Array.isArray(response.result)
      ? response.result.filter((type): type is string => typeof type === 'string')
      : []
    known = {anyTag: response.syncTags?.length === 1 ? response.syncTags[0] : undefined, types}
    typesCache.set(key, known)
  }
  if (known.anyTag && remaining.delete(known.anyTag)) {
    resolved.set(known.anyTag, {kind: 'any'})
  }

  const answers = probeCache.get(key) ?? new Map<string, string | null>()
  probeCache.set(key, answers)

  const settle = (probe: Probe, tag: string | null) => {
    if (tag && remaining.delete(tag)) resolved.set(tag, probe.meaning)
  }

  const seen = new Set<string>()
  let budget = MAX_SYNC_TAG_PROBES
  /** Probes in order, skipping those already asked about and reading cached answers for free */
  const run = async (probes: readonly Probe[]) => {
    const queue: Probe[] = []
    for (const probe of probes) {
      if (seen.has(probe.key)) continue
      seen.add(probe.key)
      const answer = answers.get(probe.key)
      if (answer === undefined) queue.push(probe)
      else settle(probe, answer)
    }
    const worker = async () => {
      while (remaining.size > 0 && queue.length > 0 && budget > 0) {
        signal?.throwIfAborted()
        const probe = queue.shift()!
        budget--
        const tag = await ask(probe)
        answers.set(probe.key, tag)
        settle(probe, tag)
      }
    }
    await Promise.all(Array.from({length: PROBE_CONCURRENCY}, worker))
    signal?.throwIfAborted()
  }
  /** The single tag a probe's response carries, or `null` when it carries none or several */
  const ask = async (probe: Probe): Promise<string | null> => {
    if (probe.dataset === undefined) {
      const response = await fetchProbe(client, probe.query, probe.params, signal)
      // A count over one filter carries that filter's tag alone; anything else is not its tag
      return response.syncTags?.length === 1 ? response.syncTags[0] : null
    }
    // A dataset the client cannot ask, or that answers with an error, has no tag to learn
    try {
      const other = client.withConfig?.({dataset: probe.dataset})
      if (!other) return null
      const response = await fetchProbe(other, probe.query, probe.params, signal)
      return response.syncTags?.length === 1 ? response.syncTags[0] : null
    } catch {
      signal?.throwIfAborted()
      return null
    }
  }

  const {perspective, projectId} = client.config()
  const releases = releasesOfPerspective(perspective)
  // Types, datasets and slugs are few and cover many documents each, while a large result can
  // list more ids than the budget holds, so the ids go last
  const probesFor = (candidates: SyncTagCandidates): Probe[] => [
    ...candidates.types.map(typeProbe),
    ...candidates.datasets.map(datasetProbe),
    ...candidates.slugs.map(slugProbe),
    ...candidates.referencedIds.map(idProbe),
    ...candidates.ids.map(idProbe),
  ]

  const written = query ? collectQuerySyncTagCandidates(query, params) : undefined
  const shown = collectSyncTagCandidates(result, sourceMap, {perspective, projectId})
  await run(
    probesFor({
      types: [...(written?.types ?? []), ...shown.types],
      slugs: [...(written?.slugs ?? []), ...shown.slugs],
      // What the query compares `_id` with it filters by, which is as specific as a tag gets
      referencedIds: [...expandIds(written?.ids ?? [], releases), ...shown.referencedIds],
      ids: shown.ids,
      datasets: shown.datasets,
    }),
  )

  let overflow: string[] = []
  let missing: string[] = []
  if (remaining.size > 0 && written && written.traces.length > 0) {
    const traced = await traceCandidates(client, written.traces, params, releases, signal)
    overflow = traced.overflow
    missing = traced.missing
    await run(probesFor(traced.candidates))
  }

  if (remaining.size > 0 && !sourceMap && loadSourceMap) {
    let loaded: SyncTagSourceMap | undefined
    try {
      loaded = await loadSourceMap(signal)
    } catch {
      // Without a source map the rest is still worth probing, but an abort ends the lookup
      signal?.throwIfAborted()
    }
    if (loaded) {
      await run(probesFor(collectSyncTagCandidates(result, loaded, {perspective, projectId})))
    }
  }

  // What is left of the budget goes to the documents of a trace too long for a response to be
  // tagged with one by one, and to the dataset's other types. A request sliced to a few
  // documents stops reading early and is tagged with the first documents the trace lists, in
  // the order it read them, so those come first for such a query; one that read them all is
  // tagged with their types and with the references it failed to read, which come first for
  // any other
  const stopsEarly = () => expandIds(overflow, releases).map(idProbe)
  const readsNothing = () => expandIds(missing, releases).map(idProbe)
  const otherTypes = () => known.types.map(typeProbe)
  const late = written?.sliced
    ? [stopsEarly, readsNothing, otherTypes]
    : [readsNothing, otherTypes, stopsEarly]
  for (const probes of late) {
    if (remaining.size === 0) break
    await run(probes())
  }
  return resolved
}

/** A tag's meaning as the GROQ filter it stands for */
export function formatSyncTagMeaning(meaning: SyncTagMeaning): string {
  switch (meaning.kind) {
    case 'any':
      return '*'
    case 'type':
      return `_type == ${JSON.stringify(meaning.type)}`
    case 'id':
      return `_id == ${JSON.stringify(meaning.id)}`
    case 'slug':
      return `slug.current == ${JSON.stringify(meaning.slug)}`
    case 'dataset':
      return `* in dataset ${JSON.stringify(meaning.dataset)}`
    default: {
      const unknownMeaning: never = meaning
      throw new Error(`Unknown sync tag meaning: ${JSON.stringify(unknownMeaning)}`)
    }
  }
}
