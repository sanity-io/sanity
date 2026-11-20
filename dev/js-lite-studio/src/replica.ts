/**
 * The document replica of the Rust studio's `replica.rs`, with its constants and algorithm: a
 * copy of every document small enough to keep, warmed up type by type after login (the types of
 * open lists first) and kept current by one listener for the whole dataset, within the same
 * memory budget (`?cache=<MiB>`, 24 MiB by default), evicting the least recently shown documents
 * when on-demand fetches go over it.
 *
 * The warm-up streams: each page is read document by document as it downloads, and stored in
 * slices that yield to the main thread, so neither parsing nor storing a page blocks a frame or a
 * key press. The replica is persisted to IndexedDB (unless `?persist=0`) and restored on the next
 * visit of the same user before the warm-up starts. A restored group is stale until its type is
 * revalidated: the `_id` and `_rev` of every document listed, the cached documents whose revision
 * is unchanged confirmed, the changed ones refetched and the deleted ones dropped. A reconnected
 * listener revalidates the same way.
 *
 * What differs is how a document is held: the Rust studio keeps the JSON text compressed, this
 * studio keeps the parsed objects, as JS code does, and persists them as JSON text, which
 * IndexedDB reads back as a copy, where objects would be rebuilt all at once before the restore
 * could start. Their size is estimated from the JSON length with the ratio heap snapshots of this
 * dataset's documents measured in Chrome.
 *
 * Rows and panes follow the rule of the Rust studio: a row shows a skeleton until every document
 * of its group (published, draft and release versions) is cached, the cached documents faded while
 * they are stale, and a row without one opens its document without a loading state.
 */
import {type SanityDocument} from '@sanity/client'
import {useSyncExternalStore} from 'react'

import {client, queryDocuments} from './client'
import {type Ordering} from './DocumentList'
import * as persistence from './persist'
import {type Perspective} from './perspective'
import {type DocPreview, previewFromDocument} from './preview-data'
import {route} from './router'
import {schema} from './schema'
import {Atom, Emitter} from './state'
import {isObject, type JsonObject, previewText, sleep, sliceExpired, yieldToMain} from './util'

const DEFAULT_BUDGET_MIB = 24
/** Larger documents are left out of the warm-up and load when a row shows them. */
const DOC_LIMIT = 64 * 1024
/** Types whose first documents average more than this, or have none small enough to keep, are
 * left out of the warm-up. */
const TYPE_AVERAGE_LIMIT = 16 * 1024
const FIRST_PAGE = 4
const PAGE_BYTES = 1_500_000
const WARM_WORKERS = 3
/** Groups fetched per on-demand query, and how many of those run at once. */
const FETCH_BATCH = 25
const FETCHES = 2
const RETRIES = 3
/** Revisions listed per revalidation query, and changed documents refetched per query. */
const LIST_PAGE = 10_000
const REFETCH_BATCH = 200
/** Types holding fewer documents than this between them are revalidated by one listing, up to
 * this many types. */
const BATCH_DOCS = 5_000
const BATCH_TYPES = 64
/** The fields `insert` reads, besides the type's title field. */
const INDEX_FIELDS = ['_id', '_type', '_rev', '_createdAt', '_updatedAt']
/** The version of the persisted records, bumped when their shape changes. */
const FORMAT = 2
/** The persisted replica keeps a type in records of about this many bytes of JSON, one
 * transaction each. A restore parses a record without yielding, so it stays well under a frame on
 * a slow device. */
const CHUNK_BYTES = 128 * 1024
/** How long the persisted replica waits after a change before saving it, and after the warm-up. */
const SAVE_AFTER_CHANGE_MS = 5000
const SAVE_AFTER_WARM_MS = 1000
/** Heap bytes per byte of JSON of the parsed documents, from Chrome heap snapshots. */
const OBJECT_FACTOR = 1.29
/** The index fields of a document (an object with two heap numbers), and of a group (its map
 * entry, object and array). */
const DOC_OVERHEAD = 80
const GROUP_OVERHEAD = 100

/** `published`, `draft`, or the release name of a version. */
type Kind = 'published' | 'draft' | {release: string}

interface CachedDoc {
  kind: Kind
  /** Index into `types`: a group's draft can be of another type than its published document. */
  type: number
  /** The pass of its type that last saw the document. */
  pass: number
  created: number
  updated: number
  /** Length of the JSON text, in bytes. */
  len: number
  /** The revision, to tell whether the dataset has a newer one. */
  rev: string | undefined
  /** The preview title in lower case, for sorting and searching. */
  title: string | undefined
  /** `undefined` for a document too large for the warm-up, or evicted. */
  body: JsonObject | undefined
}

interface Group {
  docs: CachedDoc[]
  /** Index into `types`, -1 for a group fetched on demand that has no documents. */
  type: number
  /** Every document of the group is known: its type was warmed, or the group was fetched. */
  known: boolean
  /** False for a group restored from the last visit until its type is revalidated or the group
   * fetched: its documents may have changed meanwhile. */
  fresh: boolean
  lastUsed: number
}

interface TypeState {
  name: string
  titleField: string | undefined
  /** The whole type was fetched once, so its index is complete. */
  complete: boolean
  skipped: boolean
  pass: number
  /** What the replica holds of the type may be out of date: it was restored, or the listener
   * reconnected. */
  revalidate: boolean
  /** Changed since it was last saved. */
  dirty: boolean
  /** Of the persisted records of the type. */
  generation: number
}

/** A group as the persisted record of a type keeps it: its documents of that type. */
interface PersistedGroup {
  id: string
  known: boolean
  docs: PersistedDoc[]
}

interface PersistedDoc {
  kind: Kind
  created: number
  updated: number
  len: number
  /** Only for a document without a body, which has its own. */
  rev: string | undefined
  title: string | undefined
  body: JsonObject | undefined
}

interface TypeRecord {
  generation: number
  chunks: number
  complete: boolean
  skipped: boolean
  titleField: string | undefined
}

export interface CacheStatus {
  /** Documents whose body the replica holds. */
  docs: number
  groups: number
  /** Estimated heap bytes of the replica, documents and index. */
  bytes: number
  /** Size of the JSON of the documents held. */
  jsonBytes: number
  budget: number
  typesDone: number
  types: number
  warming: boolean
  /** When the warm-up finished, in ms since navigation start, and how long it took. */
  warmedAt: number | undefined
  warmedIn: number | undefined
  /** The warm-up stopped because the next page would not fit the budget. */
  full: boolean
  evictions: number
  fetched: number
  /** Documents restored from the last visit, and when and how fast. */
  restoredDocs: number
  restoredAt: number | undefined
  restoredIn: number | undefined
  /** Restored groups that are not revalidated yet. */
  staleGroups: number
  /** When the replica was last saved, how many bytes of JSON that wrote, and how long it took. */
  persistedAt: number | undefined
  persistedBytes: number | undefined
  persistedIn: number | undefined
  saving: boolean
}

function sameKind(a: Kind, b: Kind): boolean {
  return typeof a === 'string' || typeof b === 'string' ? a === b : a.release === b.release
}

function parseId(id: string): [string, Kind] {
  if (id.startsWith('drafts.')) return [id.slice('drafts.'.length), 'draft']
  if (id.startsWith('versions.')) {
    const rest = id.slice('versions.'.length)
    const dot = rest.indexOf('.')
    if (dot !== -1) return [rest.slice(dot + 1), {release: rest.slice(0, dot)}]
  }
  return [id, 'published']
}

function rawId(published: string, kind: Kind): string {
  if (kind === 'published') return published
  if (kind === 'draft') return `drafts.${published}`
  return `versions.${kind.release}.${published}`
}

function seconds(value: unknown): number {
  const time = typeof value === 'string' ? Date.parse(value) : Number.NaN
  return Number.isNaN(time) ? 0 : Math.floor(time / 1000)
}

function docCost(doc: CachedDoc): number {
  return (
    DOC_OVERHEAD +
    (doc.title === undefined ? 0 : 16 + doc.title.length) +
    // A body holds the revision string the document points at.
    (doc.body === undefined
      ? doc.rev === undefined
        ? 0
        : 16 + doc.rev.length
      : Math.round(doc.len * OBJECT_FACTOR))
  )
}

function groupCost(id: string): number {
  return GROUP_OVERHEAD + 16 + id.length
}

function get(group: Group, kind: Kind): CachedDoc | undefined {
  return group.docs.find((doc) => sameKind(doc.kind, kind))
}

function complete(group: Group): boolean {
  return group.known && group.docs.every((doc) => doc.body !== undefined)
}

/** The document `perspective` shows, like the list query: a release version over the draft over
 * the published document. */
function shownDoc(group: Group, perspective: Perspective): CachedDoc | undefined {
  switch (perspective.kind) {
    case 'published':
      return get(group, 'published')
    case 'drafts':
      return get(group, 'draft') ?? get(group, 'published')
    case 'release':
      return (
        get(group, {release: perspective.name}) ?? get(group, 'draft') ?? get(group, 'published')
      )
    default: {
      const exhaustive: never = perspective
      return exhaustive
    }
  }
}

const WORD = /[^\p{L}\p{N}]+/u

function words(text: string): string[] {
  return text.split(WORD).filter(Boolean)
}

/** A list search like `<title> match "<search>*"`: every word matches a word of the title, the
 * last one as a prefix. */
function matcher(search: string): ((title: string) => boolean) | undefined {
  const wanted = words(search.toLowerCase())
  if (wanted.length === 0) return undefined
  const last = wanted.length - 1
  return (title) => {
    const candidates = words(title)
    return wanted.every((word, index) =>
      candidates.some((candidate) =>
        index === last ? candidate.startsWith(word) : candidate === word,
      ),
    )
  }
}

const encoder = new TextEncoder()

/** The length of a document's JSON in bytes, as the warm-up measures it. */
function lengthOf(doc: JsonObject): number {
  return encoder.encode(JSON.stringify(doc)).length
}

function fieldsOf(state: TypeState): string[] {
  return state.titleField ? [...INDEX_FIELDS, state.titleField] : INDEX_FIELDS
}

function urlParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name)
}

function budgetFromUrl(): number {
  const value = Number(urlParam('cache') ?? Number.NaN)
  const mib = Number.isFinite(value) && value >= 0 ? value : DEFAULT_BUDGET_MIB
  return Math.floor(mib * 1024 * 1024)
}

const budget = budgetFromUrl()
/** Whether the replica persists, unless `?persist=0`; benchmarks use it to load cold. */
const persist = urlParam('persist') !== '0'

const types: TypeState[] = []
const typeIndex = new Map<string, number>()
const groups = new Map<string, Group>()
/** Listener events received, and the latest per document, so a page fetched before an event does
 * not overwrite what the event brought. */
let seq = 0
const touched = new Map<string, number>()
let bytes = 0
let jsonBytes = 0
let bodies = 0
let clock = 0
let evictions = 0
let fetchedCount = 0
let staleGroups = 0

const queue: number[] = []
let workers = 0
let started = 0
let full = false
let welcomed = false
const wanted = new Map<string, number>()
let pending: string[] = []
const inFlight = new Set<string>()
let pumpQueued = false
/** Groups `prefetch` asks for, until they are fetched. */
const prefetched = new Set<string>()
let fetches = 0

let user = ''
let db: persistence.Db | undefined
let restored = false
let restoredDocs = 0
let restoredAt: [number, number] | undefined
let saving = false
let saveAgain = false
let saveRequests = 0
let metaSaved = false
/** Persisted types the schema no longer has, or whose records cannot be read, to delete. */
const orphans: string[] = []
let persisted: [number, number, number] | undefined

/** Per type: changes of what lists sort and filter on, and of anything a row shows. */
const lists = new Emitter()
const rows = new Emitter()
const listGenerations = new Map<string, number>()
const rowGenerations = new Map<string, number>()

export const status = new Atom<CacheStatus>({
  docs: 0,
  groups: 0,
  bytes: 0,
  jsonBytes: 0,
  budget,
  typesDone: 0,
  types: 0,
  warming: false,
  warmedAt: undefined,
  warmedIn: undefined,
  full: false,
  evictions: 0,
  fetched: 0,
  restoredDocs: 0,
  restoredAt: undefined,
  restoredIn: undefined,
  staleGroups: 0,
  persistedAt: undefined,
  persistedBytes: undefined,
  persistedIn: undefined,
  saving: false,
})

function bumpRows(type: number): void {
  const name = types[type]?.name
  if (name === undefined) return
  rowGenerations.set(name, (rowGenerations.get(name) ?? 0) + 1)
  rows.emit(name)
}

/** Re-renders the lists of a type, and its rows. */
function bump(type: number): void {
  const name = types[type]?.name
  if (name === undefined) return
  listGenerations.set(name, (listGenerations.get(name) ?? 0) + 1)
  lists.emit(name)
  bumpRows(type)
}

function updateStatus(): void {
  const previous = status.get()
  const warming = workers > 0
  let {warmedAt, warmedIn} = previous
  if (warmedAt === undefined && !warming && queue.length === 0 && types.some((t) => t.pass > 0)) {
    warmedAt = performance.now()
    warmedIn = warmedAt - started
  }
  const next: CacheStatus = {
    docs: bodies,
    groups: groups.size,
    bytes,
    jsonBytes,
    budget,
    typesDone: types.filter((state) => state.complete || state.skipped).length,
    types: types.length,
    warming,
    warmedAt,
    warmedIn,
    full,
    evictions,
    fetched: fetchedCount,
    restoredDocs,
    restoredAt: restoredAt?.[0],
    restoredIn: restoredAt?.[1],
    staleGroups,
    persistedAt: persisted?.[0],
    persistedBytes: persisted?.[1],
    persistedIn: persisted?.[2],
    saving,
  }
  const changed = (Object.keys(next) as (keyof CacheStatus)[]).some(
    (key) => next[key] !== previous[key],
  )
  if (!changed) return
  ;(window as unknown as {__studioCache: CacheStatus}).__studioCache = next
  status.set(next)
}

/** Stores a document; `keep` is false for one too large to keep the body of, which only has the
 * index fields. Returns its type, and whether what lists sort and filter on changed. */
function insert(doc: JsonObject, len: number, keep: boolean): [number, boolean] | undefined {
  const type = typeof doc._type === 'string' ? typeIndex.get(doc._type) : undefined
  if (type === undefined || typeof doc._id !== 'string') return undefined
  const [published, kind] = parseId(doc._id)
  const state = types[type]
  const title = state.titleField ? previewText(doc[state.titleField]) : undefined
  const next: CachedDoc = {
    kind,
    type,
    pass: state.pass,
    created: seconds(doc._createdAt),
    updated: seconds(doc._updatedAt),
    len,
    rev: typeof doc._rev === 'string' ? doc._rev : undefined,
    title: title?.toLowerCase(),
    body: keep ? doc : undefined,
  }
  const held = groups.get(published)?.docs.find((existing) => sameKind(existing.kind, kind))
  // A document fetched again at the revision the replica holds, eg a stale row's, changes nothing
  // the persisted records hold, so they are not written again for it.
  const unchanged =
    held !== undefined &&
    held.rev !== undefined &&
    held.rev === next.rev &&
    held.type === type &&
    (held.body === undefined) === (next.body === undefined)
  if (!unchanged) state.dirty = true
  let added = docCost(next)
  if (next.body) {
    bodies++
    jsonBytes += len
  }
  let group = groups.get(published)
  if (!group) {
    added += groupCost(published)
    group = {docs: [], type, known: state.complete, fresh: true, lastUsed: 0}
    groups.set(published, group)
  }
  group.type = type
  let removed = 0
  let listed = true
  const index = group.docs.findIndex((existing) => sameKind(existing.kind, kind))
  if (index === -1) group.docs.push(next)
  else {
    const existing = group.docs[index]
    // The record of the type the document had holds it until that type saves again.
    if (!unchanged) types[existing.type].dirty = true
    removed = docCost(existing)
    if (existing.body) {
      bodies--
      jsonBytes -= existing.len
    }
    listed =
      existing.title !== next.title ||
      existing.updated !== next.updated ||
      existing.created !== next.created
    group.docs[index] = next
  }
  bytes += added - removed
  return [type, listed]
}

function remove(id: string): number | undefined {
  const [published, kind] = parseId(id)
  const group = groups.get(published)
  if (!group) return undefined
  const index = group.docs.findIndex((doc) => sameKind(doc.kind, kind))
  if (index === -1) return undefined
  const [doc] = group.docs.splice(index, 1)
  bytes -= docCost(doc)
  if (doc.body) {
    bodies--
    jsonBytes -= doc.len
  }
  for (const type of [group.type, doc.type]) if (types[type]) types[type].dirty = true
  return group.type
}

/** Marks a type warmed, after a pass that fetched all of it: every group is known. */
function completeType(type: number, pass: number, since: number): void {
  const state = types[type]
  state.dirty ||= !state.complete
  state.complete = true
  state.revalidate = false
  endPass(type, pass, since)
}

/** Ends a pass that listed every document of a type: its groups are current, and the documents
 * the pass did not see (deleted while the replica was not listening) go. */
function endPass(type: number, pass: number, since: number): void {
  const whole = types[type].complete
  const stale: string[] = []
  for (const [published, group] of groups) {
    if (group.type === type) {
      group.known ||= whole
      if (!group.fresh) {
        group.fresh = true
        staleGroups--
      }
    }
    // Passes count per type, and a group's draft can be of another type than the rest.
    for (const doc of group.docs) {
      if (doc.type === type && doc.pass < pass) stale.push(rawId(published, doc.kind))
    }
  }
  for (const id of stale) if ((touched.get(id) ?? 0) <= since) remove(id)
}

/**
 * Checks a document a revalidation pass listed against the cached one: marks it seen by the pass
 * when its revision is unchanged, and returns whether to refetch it. That is when it changed, or
 * when it is new and its type is held whole (`complete`) or its group is known whole. The new
 * documents of a group known in part, eg the drafts and versions a warm-up stopped at the budget
 * never reached, are left to the fetch of the group a row showing it makes anyway.
 */
function checkListed(id: string, rev: string, pass: number, complete: boolean): boolean {
  const [published, kind] = parseId(id)
  const group = groups.get(published)
  if (!group) return complete
  const doc = get(group, kind)
  if (!doc) return complete || group.known
  if (doc.rev !== rev) return true
  doc.pass = pass
  return false
}

function setFresh(published: string): void {
  const group = groups.get(published)
  if (group && !group.fresh) {
    group.fresh = true
    staleGroups--
  }
}

/** Drops the bodies of the least recently shown groups until the replica fits the budget, and
 * returns their types. */
function evict(): number[] {
  const evicted = new Set<number>()
  if (bytes <= budget) return []
  const candidates: [number, string][] = []
  for (const [id, group] of groups) {
    if (group.docs.some((doc) => doc.body !== undefined)) candidates.push([group.lastUsed, id])
  }
  candidates.sort((a, b) => a[0] - b[0])
  for (const [, id] of candidates) {
    if (bytes <= budget) break
    const group = groups.get(id)
    if (!group) continue
    evicted.add(group.type)
    for (const doc of group.docs) {
      if (!doc.body) continue
      types[doc.type].dirty = true
      evicted.add(doc.type)
      bytes -= docCost(doc)
      doc.body = undefined
      bytes += docCost(doc)
      bodies--
      jsonBytes -= doc.len
    }
    evictions++
  }
  return [...evicted]
}

function onEvent(event: {
  type: string
  documentId?: string
  result?: SanityDocument
  transition?: string
}): void {
  if (event.type === 'welcome') {
    if (welcomed) {
      // Events may have been missed: check every type that was fetched against the dataset
      // again, without showing its rows as stale for what is likely nothing.
      for (const state of types) state.revalidate ||= state.pass > 0 || state.complete
      queue.splice(0, queue.length, ...types.map((_, index) => index))
      full = false
    }
    welcomed = true
    spawnWorkers()
    return
  }
  if (event.type !== 'mutation' || !event.documentId) return
  seq++
  touched.set(event.documentId, seq)
  const doc = event.transition === 'disappear' ? undefined : event.result
  const type = doc
    ? insert(doc as unknown as JsonObject, lengthOf(doc as unknown as JsonObject), true)?.[0]
    : remove(event.documentId)
  if (type === undefined) return
  const evicted = evict()
  bump(type)
  for (const index of evicted) bumpRows(index)
  updateStatus()
  scheduleSave(SAVE_AFTER_CHANGE_MS)
}

/** Starts reading the persisted replica, before the user is known. */
export function preloadReplica(): void {
  if (persist) persistence.preload()
}

/** Deletes the persisted replica, when the user logs out. */
export function forgetReplica(): Promise<void> {
  return persistence.forget()
}

/** Restores the persisted replica of `userId`, opens the listener for every document type of the
 * schema, and warms up (or revalidates what was restored) once both are done. */
export function startReplica(userId: string): void {
  if (started) return
  started = performance.now()
  user = userId
  for (const def of schema().documentTypes) {
    typeIndex.set(def.name, types.length)
    types.push({
      name: def.name,
      titleField: schema().preview(def.name).title,
      complete: false,
      skipped: false,
      pass: 0,
      revalidate: false,
      dirty: false,
      generation: 0,
    })
  }
  queue.push(...types.map((_, index) => index))
  client()
    .listen('*[_type in $types]', {types: types.map((state) => state.name)}, {
      includeResult: true,
      includeAllVersions: true,
      events: ['welcome', 'mutation', 'reconnect'],
      tag: 'replica.listener',
    } as never)
    .subscribe({next: (event) => onEvent(event as never), error: () => undefined})
  if (persist) {
    void restore()
    // A tab that is hidden may be closed or discarded next: save what changed.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void save()
    })
  } else restored = true
  updateStatus()
}

/** Moves a type to the front of the warm-up, eg when a list of it opens. */
export function prioritize(typeName: string): void {
  const type = typeIndex.get(typeName)
  if (type === undefined) return
  const position = queue.indexOf(type)
  if (position === -1) return
  queue.splice(position, 1)
  queue.unshift(type)
}

function spawnWorkers(): void {
  if (!welcomed || !restored) return
  while (workers < WARM_WORKERS && queue.length > 0) {
    workers++
    void warmWorker()
  }
  updateStatus()
}

/** Saves the persisted replica `delay` ms after the last call. */
function scheduleSave(delay: number): void {
  if (!persist) return
  const request = ++saveRequests
  setTimeout(() => {
    if (saveRequests === request) void save()
  }, delay)
}

/** Whether `count` more documents of a type fit the budget, estimated from what the cached ones
 * take per byte of JSON, and from the type's average size once some are fetched. */
function wouldFit(count: number, averageJson: number | undefined): boolean {
  let perDoc: number
  if (bodies === 0) perDoc = 512
  else if (averageJson !== undefined) perDoc = (averageJson * bytes) / Math.max(jsonBytes, 1)
  else perDoc = bytes / bodies
  return bytes + count * perDoc <= budget
}

async function queryPage(
  groq: string,
  params: Record<string, unknown>,
  tag: string,
): Promise<JsonObject[] | undefined> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await client().fetch<JsonObject[]>(groq, params, {perspective: 'raw', tag})
    } catch {
      if (attempt >= RETRIES) return undefined
      await sleep(1000 << attempt)
    }
  }
}

/** `first`, and when it is to be revalidated and holds few documents, the queued types that are
 * too and hold few documents, taken off the queue to be listed with it. */
function revalidationBatch(first: number): number[] {
  const batch = [first]
  if (!types[first].revalidate) return batch
  const counts = types.map(() => 0)
  for (const group of groups.values()) for (const doc of group.docs) counts[doc.type]++
  let total = counts[first]
  if (total >= BATCH_DOCS) return batch
  for (let index = 0; index < queue.length;) {
    const type = queue[index]
    if (batch.length < BATCH_TYPES && types[type].revalidate && total + counts[type] < BATCH_DOCS) {
      batch.push(type)
      total += counts[type]
      queue.splice(index, 1)
    } else index++
  }
  return batch
}

/** Takes types off the queue: checks what the replica holds of a type when that may be out of
 * date, then fetches the type whole unless it is already, was skipped, or the budget is full. */
async function warmWorker(): Promise<void> {
  for (;;) {
    const type = queue.shift()
    if (type === undefined) break
    const batch = revalidationBatch(type)
    if (types[type].revalidate) await revalidateTypes(batch)
    for (const index of batch) {
      const state = types[index]
      if (!state.complete && !state.skipped && !full) await warmType(index)
    }
  }
  workers--
  updateStatus()
  if (workers === 0) scheduleSave(SAVE_AFTER_WARM_MS)
}

/** Stores a document of a pass unless the listener brought a newer one since it started. */
function storeQueried(
  doc: JsonObject | undefined,
  fields: JsonObject,
  len: number,
  since: number,
): void {
  const id = fields._id
  if (typeof id !== 'string' || (touched.get(id) ?? 0) > since) return
  insert(doc ?? fields, len, doc !== undefined)
}

/** Stores a query's documents as they stream in, in slices that yield to the main thread, and
 * runs the query again when it fails. Returns how many documents it returned, `undefined` once it
 * failed `RETRIES` times. */
async function streamDocuments(
  groq: string,
  params: Record<string, unknown>,
  tag: string,
  fields: string[],
  since: number,
): Promise<number | undefined> {
  for (let attempt = 0; ; attempt++) {
    let count = 0
    try {
      for await (const queried of queryDocuments(groq, params, tag, DOC_LIMIT, fields)) {
        count++
        storeQueried(queried.doc, queried.fields, queried.len, since)
        if (sliceExpired()) await yieldToMain()
      }
      return count
    } catch {
      if (attempt >= RETRIES) return undefined
      await sleep(1000 << attempt)
    }
  }
}

/**
 * Checks what the replica holds of some types against the dataset, for a fraction of a warm-up:
 * lists the id and revision of every document of the types, confirms the cached documents whose
 * revision is unchanged, refetches the changed ones (and the new ones of a type held whole, or of
 * a group known whole), and drops those deleted meanwhile. A replica restored from the last visit comes
 * back current this way, and so does one that missed events while the listener reconnected. A
 * type whose pass fails is left to revalidate, its rows still stale.
 */
async function revalidateTypes(batch: number[]): Promise<void> {
  const since = seq
  const passes = new Map<number, [number, boolean]>()
  for (const type of batch) {
    const state = types[type]
    state.pass++
    passes.set(type, [state.pass, state.complete])
  }
  const current = (type: number) => types[type].pass === passes.get(type)?.[0]
  const names = batch.map((type) => types[type].name)
  const changed = new Map<number, string[]>()
  let after = ''
  for (let attempt = 0; ;) {
    let count = 0
    try {
      for await (const listed of queryDocuments(
        `*[_type in $types && _id > $after] | order(_id) [0...${LIST_PAGE}] {_id, _type, _rev}`,
        {types: names, after},
        'replica.revalidate',
        0,
        ['_id', '_type', '_rev'],
      )) {
        count++
        const {_id: id, _type: name, _rev: rev} = listed.fields
        if (typeof id !== 'string' || typeof name !== 'string' || typeof rev !== 'string') continue
        after = id
        const type = typeIndex.get(name)
        const pass = type === undefined ? undefined : passes.get(type)
        if (type !== undefined && pass && checkListed(id, rev, pass[0], pass[1])) {
          const list = changed.get(type)
          if (list) list.push(id)
          else changed.set(type, [id])
        }
        if (sliceExpired()) await yieldToMain()
      }
    } catch {
      if (attempt >= RETRIES) return
      await sleep(1000 << attempt)
      attempt++
      continue
    }
    attempt = 0
    if (!batch.some(current)) return
    if (count < LIST_PAGE) break
  }
  for (const type of batch) {
    const ids = changed.get(type) ?? []
    const fields = fieldsOf(types[type])
    for (let start = 0; start < ids.length && current(type); start += REFETCH_BATCH) {
      const fetched = await streamDocuments(
        '*[_id in $ids]',
        {ids: ids.slice(start, start + REFETCH_BATCH)},
        'replica.refetch',
        fields,
        since,
      )
      bump(type)
      if (fetched === undefined) return
    }
    if (!current(type)) continue
    endPass(type, passes.get(type)?.[0] ?? 0, since)
    types[type].revalidate = false
    const evicted = evict()
    bump(type)
    for (const index of evicted) bumpRows(index)
    // Ending a pass walks every group, and a batch can end dozens of types at once.
    if (sliceExpired()) await yieldToMain()
  }
  updateStatus()
}

/**
 * Fetches every document of a type in pages ordered by id, small at first so a type of large
 * documents is noticed early, then sized to about `PAGE_BYTES`. A page is stored document by
 * document as it downloads, in slices that yield to the main thread, so neither parsing a page nor
 * storing it blocks a frame or a key press.
 */
async function warmType(type: number): Promise<void> {
  const state = types[type]
  state.pass++
  state.skipped = false
  const pass = state.pass
  const since = seq
  const fields = fieldsOf(state)
  let after = ''
  let size = FIRST_PAGE
  // Only the documents small enough to keep count towards the average, so one huge document
  // neither skips a type of small ones nor shrinks its pages.
  let seen = 0
  let kept = 0
  let keptBytes = 0
  let attempt = 0
  for (;;) {
    if (!wouldFit(size, kept > 0 ? keptBytes / kept : undefined)) {
      // The types still queued are only revalidated.
      full = true
      updateStatus()
      return
    }
    let count = 0
    let failed = false
    try {
      for await (const queried of queryDocuments(
        `*[_type == $type && _id > $after] | order(_id) [0...${size}]`,
        {type: state.name, after},
        'replica.warm',
        DOC_LIMIT,
        fields,
      )) {
        count++
        const id = queried.fields._id
        if (typeof id !== 'string') continue
        seen++
        if (queried.doc) {
          kept++
          keptBytes += queried.len
        }
        after = id
        storeQueried(queried.doc, queried.fields, queried.len, since)
        if (sliceExpired()) {
          await yieldToMain()
          // Another worker filled the budget: the rest of the page is not needed.
          if (full) {
            failed = true
            break
          }
        }
      }
    } catch {
      failed = true
    }
    if (failed) {
      // What a page that failed partway did read is good, and the next attempt goes on after it.
      bump(type)
      updateStatus()
      if (full || attempt >= RETRIES) return
      await sleep(1000 << attempt)
      attempt++
      continue
    }
    attempt = 0
    const skip = seen >= FIRST_PAGE && (kept === 0 || keptBytes / kept > TYPE_AVERAGE_LIMIT)
    // A reconnect starts a new pass of every type while this one may still run.
    const superseded = state.pass !== pass
    if (!superseded && count < size) completeType(type, pass, since)
    else if (!superseded && skip) {
      state.dirty ||= !state.skipped
      state.skipped = true
    }
    bump(type)
    updateStatus()
    if (count < size || skip || superseded) return
    const average = kept > 0 ? Math.max(keptBytes / kept, 1) : DOC_LIMIT
    size = Math.min(Math.max(Math.floor(PAGE_BYTES / average), size), size * 4)
  }
}

/** Fetches every document of each group in `ids` (published, draft and versions). */
async function fetchGroups(ids: string[]): Promise<void> {
  const since = seq
  const filter = ids.map((_, index) => `sanity::versionOf($id${index})`).join(' || ')
  const params = Object.fromEntries(ids.map((id, index) => [`id${index}`, id]))
  const page = await queryPage(`*[${filter}]`, params, 'replica.fetch')
  const changed = new Map<number, boolean>()
  const mark = (type: number, listed: boolean) => changed.set(type, changed.get(type) || listed)
  if (page) {
    const returned = new Set<string>()
    for (const doc of page) {
      if (typeof doc._id !== 'string') continue
      returned.add(doc._id)
      if ((touched.get(doc._id) ?? 0) > since) continue
      const result = insert(doc, lengthOf(doc), true)
      if (result) mark(...result)
    }
    for (const id of ids) {
      // A group restored stale may hold documents deleted since.
      const gone = (groups.get(id)?.docs ?? [])
        .map((doc) => rawId(id, doc.kind))
        .filter((raw) => !returned.has(raw) && (touched.get(raw) ?? 0) <= since)
      for (const raw of gone) {
        const type = remove(raw)
        if (type !== undefined) mark(type, true)
      }
      // The rows that asked for the groups show them now, so they are the last to evict.
      clock++
      setFresh(id)
      const group = groups.get(id)
      if (group) {
        // The records of its documents' types persist that the group is known.
        if (!group.known) for (const doc of group.docs) types[doc.type].dirty = true
        group.known = true
        group.lastUsed = clock
        mark(group.type, false)
      } else {
        groups.set(id, {docs: [], type: -1, known: true, fresh: true, lastUsed: clock})
        bytes += groupCost(id)
      }
    }
    for (const type of evict()) mark(type, false)
    fetchedCount += ids.length
    scheduleSave(SAVE_AFTER_CHANGE_MS)
  } else {
    // Asked for again by the rows that still show them.
    pending.push(...ids)
  }
  for (const id of ids) {
    inFlight.delete(id)
    if (prefetched.delete(id)) unwant(id)
  }
  for (const [type, listed] of changed) {
    if (listed) bump(type)
    else bumpRows(type)
  }
  fetches--
  updateStatus()
  if (!page) await sleep(1000)
  pump()
}

/** Starts on-demand fetches while there is room, the most recently wanted groups first, so rows
 * that scrolled by are skipped. */
function pump(): void {
  while (fetches < FETCHES) {
    pending = pending.filter((id) => wanted.has(id) && !inFlight.has(id))
    const batch = pending.splice(Math.max(pending.length - FETCH_BATCH, 0)).reverse()
    if (batch.length === 0) return
    for (const id of batch) inFlight.add(id)
    fetches++
    void fetchGroups(batch)
  }
}

/** Asks for the documents of a group a row shows a skeleton, or stale documents, for, until
 * `unwant`. */
export function want(published: string): void {
  const count = (wanted.get(published) ?? 0) + 1
  wanted.set(published, count)
  if (count > 1) return
  pending.push(published)
  // The rows a render mounts ask one by one: pumping after them all fills whole batches, where
  // pumping on each would send the first rows alone and queue the rest behind them.
  if (pumpQueued) return
  pumpQueued = true
  queueMicrotask(() => {
    pumpQueued = false
    pump()
  })
}

/** Asks for the groups of the first rows a list is about to show that are not held current,
 * before the rows mount and ask: rendering a page of rows can take longer than the request. */
export function prefetch(ids: string[]): void {
  for (const id of ids.slice(0, FETCH_BATCH)) {
    const group = groups.get(id)
    if (prefetched.has(id) || (group?.fresh && complete(group))) continue
    prefetched.add(id)
    want(id)
  }
}

export function unwant(published: string): void {
  const count = (wanted.get(published) ?? 0) - 1
  if (count > 0) wanted.set(published, count)
  else wanted.delete(published)
}

function typeKey(name: string): string {
  return `m:${name}`
}

/** The keys of the records of a type's groups, of one generation or of all. */
function chunkPrefix(name: string, generation?: number): string {
  return generation === undefined ? `c:${name}:` : `c:${name}:${generation}:`
}

function typeRecord(value: unknown): TypeRecord | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as Partial<TypeRecord>
  return typeof record.generation === 'number' && typeof record.chunks === 'number'
    ? (record as TypeRecord)
    : undefined
}

function isPersistedGroup(value: unknown): value is PersistedGroup {
  if (typeof value !== 'object' || value === null) return false
  const group = value as Partial<PersistedGroup>
  return typeof group.id === 'string' && Array.isArray(group.docs)
}

/** The documents of a group that are of `type`, as its persisted record keeps them, and the bytes
 * of JSON that writes; `undefined` when it has none. A group whose draft is of another type than
 * its published document is persisted in the records of both types. */
function encodeGroup(
  published: string,
  group: Group,
  type: number,
): [PersistedGroup, number] | undefined {
  const docs: PersistedDoc[] = []
  let written = 0
  for (const doc of group.docs) {
    if (doc.type !== type) continue
    docs.push({
      kind: doc.kind,
      created: doc.created,
      updated: doc.updated,
      len: doc.len,
      rev: doc.body ? undefined : doc.rev,
      title: doc.title,
      body: doc.body,
    })
    written += 64 + (doc.body ? doc.len : 0)
  }
  if (docs.length === 0) return undefined
  return [{id: published, known: group.known, docs}, written]
}

/** Adds the groups of a persisted record of a type, as stale until the type is revalidated. A
 * group this session already fetched is newer and stays as it is; one restored from the record of
 * another type gets the documents of this one. Returns the documents added, `undefined` for a
 * record that does not read. */
function restoreChunk(type: number, text: unknown): number | undefined {
  if (typeof text !== 'string') return undefined
  let chunk: unknown
  try {
    chunk = JSON.parse(text)
  } catch {
    return undefined
  }
  if (!Array.isArray(chunk)) return undefined
  let added = 0
  for (const value of chunk as unknown[]) {
    if (!isPersistedGroup(value)) return undefined
    const existing = groups.get(value.id)
    if (existing?.fresh) continue
    let cost = existing ? 0 : groupCost(value.id)
    const docs: CachedDoc[] = []
    for (const persistedDoc of value.docs) {
      const held = (doc: CachedDoc) => sameKind(doc.kind, persistedDoc.kind)
      if (existing?.docs.some(held) || docs.some(held)) continue
      const body = persistedDoc.body
      const doc: CachedDoc = {
        kind: persistedDoc.kind,
        type,
        pass: 0,
        created: persistedDoc.created,
        updated: persistedDoc.updated,
        len: persistedDoc.len,
        rev: typeof body?._rev === 'string' ? body._rev : persistedDoc.rev,
        title: persistedDoc.title,
        body,
      }
      cost += docCost(doc)
      if (body) {
        bodies++
        jsonBytes += doc.len
      }
      docs.push(doc)
    }
    added += docs.length
    bytes += cost
    if (existing) {
      existing.known &&= value.known
      existing.docs.push(...docs)
    } else {
      staleGroups++
      groups.set(value.id, {docs, type, known: value.known, fresh: false, lastUsed: 0})
    }
  }
  return added
}

/** Restores the replica persisted by the last visit of the same user, type by type and in
 * slices: each type with its index state, each group stale until its type is revalidated.
 * Records of another user or format are deleted rather than read. */
async function restore(): Promise<void> {
  const startedAt = performance.now()
  const entries = await persistence.takePreloaded()
  db = await persistence.open()
  let valid = false
  const records: [string, unknown][] = []
  const chunks = new Map<string, unknown>()
  for (const [key, value] of entries) {
    if (key === 'meta') valid = isObject(value) && value.format === FORMAT && value.user === user
    else if (key.startsWith('m:')) records.push([key.slice(2), value])
    else chunks.set(key, value)
  }
  if (!valid && entries.length > 0) {
    await db?.clear()
    records.length = 0
  }
  // The type the address shows restores first, so its list is not waiting on the others.
  const shown = route.get().typeName
  records.sort(([a], [b]) => Number(a !== shown) - Number(b !== shown))
  let count = 0
  for (const [name, value] of records) {
    const type = typeIndex.get(name)
    const record = typeRecord(value)
    if (type === undefined || !record || record.titleField !== types[type].titleField) {
      orphans.push(name)
      continue
    }
    const state = types[type]
    state.generation = record.generation
    state.skipped = record.skipped
    state.revalidate = true
    const prefix = chunkPrefix(name, record.generation)
    let whole = true
    for (let index = 0; index < record.chunks; index++) {
      const added = restoreChunk(type, chunks.get(`${prefix}${index}`))
      whole &&= added !== undefined
      count += added ?? 0
      if (sliceExpired()) {
        // The rows on screen show what has been restored so far.
        bumpRows(type)
        await yieldToMain()
      }
    }
    // A type missing a record is warmed again rather than listed from what is left.
    state.complete = record.complete && whole
    bump(type)
  }
  for (const type of evict()) bumpRows(type)
  const now = performance.now()
  restoredDocs = count
  restoredAt = [now, now - startedAt]
  restored = true
  updateStatus()
  spawnWorkers()
}

/**
 * Saves the types that changed since the last save, each as a new generation of records that
 * replaces the previous one only once it is written whole, so a tab closed halfway through leaves
 * the previous generation intact. Encoding yields to the main thread between groups and every
 * record is a transaction of its own. Groups are written newest first, as lists sort by default,
 * so the rows a list opens on are in the first record its type restores.
 */
async function save(): Promise<void> {
  if (!restored) return
  if (saving) {
    saveAgain = true
    return
  }
  if (!db) return
  const dirty = types.flatMap((state, index) => (state.dirty ? [index] : []))
  const gone = orphans.splice(0)
  if (dirty.length === 0 && gone.length === 0 && metaSaved) return
  saving = true
  updateStatus()
  const startedAt = performance.now()
  let written = 0
  const writes: persistence.Write[] = [{put: 'meta', value: {format: FORMAT, user}}]
  for (const name of gone) {
    writes.push(persistence.deleteKey(typeKey(name)), persistence.deletePrefix(chunkPrefix(name)))
  }
  metaSaved = await db.write(writes)
  const ids = new Map<number, [string, number][]>(dirty.map((type) => [type, []]))
  for (const [id, group] of groups) {
    for (const doc of group.docs) {
      const list = ids.get(doc.type)
      const last = list?.[list.length - 1]
      if (last?.[0] === id) last[1] = Math.max(last[1], doc.updated)
      else list?.push([id, doc.updated])
    }
  }
  for (const list of ids.values()) list.sort((a, b) => b[1] - a[1])
  for (const type of dirty) {
    const state = types[type]
    state.dirty = false
    const generation = state.generation + 1
    const prefix = chunkPrefix(state.name, generation)
    let ok = true
    let chunks = 0
    let chunk: PersistedGroup[] = []
    let chunkBytes = 0
    const list = ids.get(type) ?? []
    for (let index = 0; index < list.length; index++) {
      const [id] = list[index]
      const group = groups.get(id)
      const encoded = group && encodeGroup(id, group, type)
      if (encoded) {
        chunk.push(encoded[0])
        chunkBytes += encoded[1]
      }
      if (chunkBytes >= CHUNK_BYTES || (index + 1 === list.length && chunk.length > 0)) {
        written += chunkBytes
        // What a save interrupted at this generation left goes first.
        const put: persistence.Write = {put: `${prefix}${chunks}`, value: JSON.stringify(chunk)}
        ok &&= await db.write(chunks === 0 ? [persistence.deletePrefix(prefix), put] : [put])
        chunks++
        chunk = []
        chunkBytes = 0
      }
      if (sliceExpired()) await yieldToMain()
    }
    if (ok) {
      const record: TypeRecord = {
        generation,
        chunks,
        complete: state.complete,
        skipped: state.skipped,
        titleField: state.titleField,
      }
      ok = await db.write([
        {put: typeKey(state.name), value: record},
        ...persistence.deletePrefixExcept(chunkPrefix(state.name), prefix),
      ])
    }
    if (ok) state.generation = generation
    else state.dirty = true
  }
  const now = performance.now()
  persisted = [now, written, now - startedAt]
  saving = false
  updateStatus()
  if (saveAgain) {
    saveAgain = false
    void save()
  }
}

/** The row preview of a cached group as `perspective` shows it, `stale` while the group is
 * restored and not revalidated yet. */
export function cachedPreview(published: string, perspective: Perspective): DocPreview | undefined {
  const group = groups.get(published)
  if (!group || !complete(group)) return undefined
  group.lastUsed = ++clock
  const doc = shownDoc(group, perspective)
  if (!doc?.body) return undefined
  return {
    ...previewFromDocument(published, doc.body, doc.kind !== 'published'),
    stale: !group.fresh,
  }
}

/** The preview of a cached group of any type in the drafts perspective, for references: `null`
 * when the group is known not to exist. */
export function referencePreview(published: string): DocPreview | null | undefined {
  const group = groups.get(published)
  if (!group || !complete(group)) return undefined
  const doc = get(group, 'draft') ?? get(group, 'published')
  if (!doc?.body) return null
  return previewFromDocument(published, doc.body, doc.kind !== 'published')
}

/** A cached group, for the document store to start from: the published document and the draft
 * (`null` when missing) and every release version, by id, the ids of the versions, and whether
 * the group is restored and not revalidated yet. */
export interface Seed {
  docs: [string, JsonObject | null][]
  versions: string[]
  stale: boolean
}

export function seedOf(published: string): Seed | undefined {
  const group = groups.get(published)
  if (!group || !complete(group)) return undefined
  group.lastUsed = ++clock
  const docs: [string, JsonObject | null][] = [
    [rawId(published, 'published'), get(group, 'published')?.body ?? null],
    [rawId(published, 'draft'), get(group, 'draft')?.body ?? null],
  ]
  const versions: string[] = []
  for (const doc of group.docs) {
    if (typeof doc.kind === 'string' || !doc.body) continue
    const id = rawId(published, doc.kind)
    docs.push([id, doc.body])
    versions.push(id)
  }
  return {docs, versions, stale: !group.fresh}
}

export function isWarmed(typeName: string): boolean {
  const type = typeIndex.get(typeName)
  return type !== undefined && types[type].complete
}

/** The published ids of a type's documents as `perspective` lists them, once the type is warmed;
 * `undefined` before. */
export function cachedList(
  typeName: string,
  perspective: Perspective,
  ordering: Ordering,
  search: string,
): string[] | undefined {
  const type = typeIndex.get(typeName)
  if (type === undefined || !types[type].complete) return undefined
  const startedAt = performance.now()
  const matches = matcher(search)
  const byTitle = types[type].titleField !== undefined
  const listed: [string, CachedDoc][] = []
  for (const [id, group] of groups) {
    if (group.type !== type) continue
    const doc = shownDoc(group, perspective)
    if (!doc) continue
    if (
      matches &&
      !(byTitle ? doc.title !== undefined && matches(doc.title) : matches(id.toLowerCase()))
    )
      continue
    listed.push([id, doc])
  }
  const byId = (a: [string, CachedDoc], b: [string, CachedDoc]) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
  switch (ordering) {
    case 'updated':
      listed.sort((a, b) => b[1].updated - a[1].updated || byId(a, b))
      break
    case 'created':
      listed.sort((a, b) => b[1].created - a[1].created || byId(a, b))
      break
    case 'title':
      // Like GROQ, documents without a title sort after the rest.
      listed.sort((a, b) => {
        const x = a[1].title
        const y = b[1].title
        if (x !== undefined && y !== undefined && x !== y) return x < y ? -1 : 1
        if (x === undefined && y !== undefined) return 1
        if (x !== undefined && y === undefined) return -1
        return byId(a, b)
      })
      break
    default: {
      const exhaustive: never = ordering
      return exhaustive
    }
  }
  const ids = listed.map(([id]) => id)
  lastList = performance.now() - startedAt
  return ids
}

let lastList = 0

/** How long the last `cachedList` took to filter and sort. */
export function lastListMs(): number {
  return lastList
}

const noop = () => () => undefined

function useGeneration(emitter: Emitter, generations: Map<string, number>, key: string): number {
  return useSyncExternalStore(
    key ? (listener) => emitter.subscribe(key, listener) : noop,
    () => generations.get(key) ?? 0,
  )
}

/** Re-renders when the lists of `typeName` change. */
export function useListGeneration(typeName: string): number {
  return useGeneration(lists, listGenerations, typeName)
}

/** Re-renders when anything a row of `typeName` shows changes. */
export function useRowGeneration(typeName: string): number {
  return useGeneration(rows, rowGenerations, typeName)
}
