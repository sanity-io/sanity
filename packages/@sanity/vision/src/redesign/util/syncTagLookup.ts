/** What a sync tag stands for: the documents whose changes invalidate a response carrying it */
export type SyncTagMeaning =
  | {kind: 'any'}
  | {kind: 'type'; type: string}
  | {kind: 'id'; id: string}
  | {kind: 'slug'; slug: string}

interface ProbeOptions {
  filterResponse: false
  /** Every document as stored, so a filter on one id matches that document alone */
  perspective: 'raw'
  /** `raw` needs the studio's credentials, which the API CDN never receives */
  useCdn: false
  returnQuery: false
  resultSourceMap: false
  stega: false
  tag: string
  signal: AbortSignal | undefined
}

/** The client calls the lookup makes; a `SanityClient` has them */
export interface SyncTagLookupClient {
  config(): {
    projectId?: string
    dataset?: string
    apiHost?: string
    apiVersion?: string
  }
  fetch(
    query: string,
    params: Record<string, string>,
    options: ProbeOptions,
  ): Promise<ProbeResponse>
}

interface ProbeResponse {
  result: unknown
  syncTags?: readonly string[]
}

/** Values from the response that its tags may have been computed from */
export interface SyncTagCandidates {
  types: string[]
  ids: string[]
  slugs: string[]
}

/** Probe queries one lookup sends at most, past the one listing the dataset's types */
export const MAX_SYNC_TAG_PROBES = 100
const PROBE_CONCURRENCY = 4
/** Nodes of the result read for candidates; a large result is sampled from its start */
const MAX_RESULT_NODES = 5_000

const TYPES_QUERY = 'array::unique(*._type)'

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
 * The `_type`s, `_id`s and `slug.current`s in a query result, each once and in the order they
 * appear. Ids and slugs in a result are the likeliest sources of its tags, and probing those it
 * shows first resolves a typical response in a handful of queries. A query sent with a
 * perspective that overlays drafts depends on the draft of each published document as well,
 * which the result shows under the published id, so those drafts are candidates too.
 */
export function collectSyncTagCandidates(result: unknown): SyncTagCandidates {
  const types = new Set<string>()
  const ids = new Set<string>()
  const slugs = new Set<string>()
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
    if (typeof record._type === 'string' && record._type) types.add(record._type)
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
  const drafts = [...ids]
    .filter((id) => !id.startsWith('drafts.') && !id.startsWith('versions.'))
    .map((id) => `drafts.${id}`)
  return {types: [...types], ids: [...new Set([...ids, ...drafts])], slugs: [...slugs]}
}

export interface ResolveSyncTagsOptions {
  candidates?: SyncTagCandidates
  signal?: AbortSignal
}

/**
 * Finds what each tag stands for by asking the API for the tags of queries whose meaning is
 * known: the list of every type (whose tag covers the whole dataset), then one count per type,
 * id and slug, until every tag is found or the probes run out. What the result shows goes first
 * (its types, ids and slugs), then the dataset's other types. A tag no probe answered with is
 * left out of the map.
 */
export async function resolveSyncTags(
  client: SyncTagLookupClient,
  tags: readonly string[],
  options: ResolveSyncTagsOptions = {},
): Promise<Map<string, SyncTagMeaning>> {
  const {candidates = {types: [], ids: [], slugs: []}, signal} = options
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

  const seen = new Set<string>()
  const probes: Probe[] = []
  for (const probe of [
    ...candidates.types.map(typeProbe),
    ...candidates.ids.map(idProbe),
    ...candidates.slugs.map(slugProbe),
    ...known.types.map(typeProbe),
  ]) {
    if (seen.has(probe.key)) continue
    seen.add(probe.key)
    probes.push(probe)
  }

  const settle = (probe: Probe, tag: string | null) => {
    if (tag && remaining.delete(tag)) resolved.set(tag, probe.meaning)
  }

  // Answers already known cost nothing, so they are read before anything is sent
  const unanswered: Probe[] = []
  for (const probe of probes) {
    const answer = answers.get(probe.key)
    if (answer === undefined) unanswered.push(probe)
    else settle(probe, answer)
  }

  const queue = unanswered.slice(0, MAX_SYNC_TAG_PROBES)
  const worker = async () => {
    while (remaining.size > 0 && queue.length > 0) {
      signal?.throwIfAborted()
      const probe = queue.shift()!
      const response = await fetchProbe(client, probe.query, probe.params, signal)
      // A count over one filter carries that filter's tag alone; anything else is not its tag
      const tag = response.syncTags?.length === 1 ? response.syncTags[0] : null
      answers.set(probe.key, tag)
      settle(probe, tag)
    }
  }
  await Promise.all(Array.from({length: PROBE_CONCURRENCY}, worker))
  signal?.throwIfAborted()
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
