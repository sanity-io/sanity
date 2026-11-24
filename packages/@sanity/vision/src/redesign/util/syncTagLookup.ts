/** What a sync tag stands for: the documents whose changes invalidate a response carrying it */
export type SyncTagMeaning =
  | {kind: 'any'}
  | {kind: 'type'; type: string}
  | {kind: 'id'; id: string}
  | {kind: 'slug'; slug: string}

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

interface Probe {
  key: string
  meaning: SyncTagMeaning
  query: string
  params: Record<string, string>
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
 * The tag each probe answered with, per client configuration: a tag is a hash of the filter and
 * the dataset it ran on, the same whatever perspective a query is sent with.
 * `null` records a probe that answered with no single tag.
 */
const probeCache = new Map<string, Map<string, string | null>>()
const typesCache = new Map<string, {anyTag: string | undefined; types: string[]}>()

function cacheKey(client: SyncTagLookupClient): string {
  const {projectId, dataset, apiHost, apiVersion} = client.config()
  return JSON.stringify([projectId, dataset, apiHost, apiVersion])
}

/** Forgets every probe answer; for tests */
export function clearSyncTagLookupCache(): void {
  probeCache.clear()
  typesCache.clear()
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
 * which of the others the tag was computed from.
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
    for (const release of releases) expanded.add(`${VERSIONS_PREFIX}${release}.${publishedId}`)
  }
  return [...expanded]
}

export interface CollectSyncTagCandidatesOptions {
  /** The perspective stack's releases, for the versions of each document to probe */
  perspective?: string | readonly string[]
}

/**
 * The `_type`s, `_id`s and `slug.current`s a query result and its source map show, each once and
 * in the order they appear, and the ids it only points to. A result that dereferences does not
 * show the documents it read, but its source map lists them, and its `_ref`s name the same
 * documents when there is no source map. Those are the likeliest sources of its tags.
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

  for (const document of sourceMap?.documents ?? []) {
    // A document of another dataset is not one a probe here can find
    if (document._projectId || document._dataset) continue
    if (typeof document._id === 'string' && document._id) sourceMapIds.add(document._id)
    if (typeof document._type === 'string' && document._type) types.add(document._type)
  }

  const queue: unknown[] = [result]
  let visited = 0
  while (queue.length > 0 && visited < MAX_RESULT_NODES) {
    const node = queue.shift()
    visited++
    if (Array.isArray(node)) {
      queue.push(...node)
      continue
    }
    if (!node || typeof node !== 'object') continue
    const record = node as Record<string, unknown>
    if (typeof record._ref === 'string' && record._ref) refs.add(record._ref)
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
  }
}

export interface ResolveSyncTagsOptions {
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
 * Finds what each tag stands for by asking the API for the tags of queries whose meaning is
 * known: the list of every type (whose tag covers the whole dataset), then one count per type,
 * id and slug, until every tag is found or the probes run out.
 *
 * The probes go in the order a tag is most likely found: the documents the result dereferences
 * (source map, then `_ref`s), its types and slugs, the ids it shows, and last the dataset's other
 * types. Without a source map, `loadSourceMap` is asked for one once what the result shows has
 * not resolved everything. A tag no probe answered with is left out of the map.
 */
export async function resolveSyncTags(
  client: SyncTagLookupClient,
  tags: readonly string[],
  options: ResolveSyncTagsOptions = {},
): Promise<Map<string, SyncTagMeaning>> {
  const {result, sourceMap, loadSourceMap, signal} = options
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
        const response = await fetchProbe(client, probe.query, probe.params, signal)
        // A count over one filter carries that filter's tag alone; anything else is not its tag
        const tag = response.syncTags?.length === 1 ? response.syncTags[0] : null
        answers.set(probe.key, tag)
        settle(probe, tag)
      }
    }
    await Promise.all(Array.from({length: PROBE_CONCURRENCY}, worker))
    signal?.throwIfAborted()
  }

  const perspective = client.config().perspective
  const probesFor = (candidates: SyncTagCandidates): Probe[] => [
    ...candidates.referencedIds.map(idProbe),
    ...candidates.types.map(typeProbe),
    ...candidates.slugs.map(slugProbe),
    ...candidates.ids.map(idProbe),
  ]

  await run(probesFor(collectSyncTagCandidates(result, sourceMap, {perspective})))

  if (remaining.size > 0 && !sourceMap && loadSourceMap) {
    let loaded: SyncTagSourceMap | undefined
    try {
      loaded = await loadSourceMap(signal)
    } catch {
      // Without a source map the rest is still worth probing, but an abort ends the lookup
      signal?.throwIfAborted()
    }
    if (loaded) {
      await run(probesFor(collectSyncTagCandidates(result, loaded, {perspective})))
    }
  }

  await run(known.types.map(typeProbe))
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
    default: {
      const unknownMeaning: never = meaning
      throw new Error(`Unknown sync tag meaning: ${JSON.stringify(unknownMeaning)}`)
    }
  }
}
