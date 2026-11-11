/**
 * The document replica of the Rust studio's `replica.rs`, with its constants and algorithm: a
 * copy of every document small enough to keep, warmed up type by type after login (the types of
 * open lists first) and kept current by one listener for the whole dataset, within the same
 * memory budget (`?cache=<MiB>`, 24 MiB by default), evicting the least recently shown documents
 * when on-demand fetches go over it.
 *
 * What differs is how a document is held: the Rust studio keeps the JSON text compressed, this
 * studio keeps the parsed objects, as JS code does. Their size is estimated from the JSON length
 * with the ratio heap snapshots of this dataset's documents measured in Chrome.
 *
 * Rows and panes follow the rule of the Rust studio: a row shows a skeleton until every document
 * of its group (published, draft and release versions) is cached, and a row without one opens its
 * document without a loading state.
 */
import {type SanityDocument} from '@sanity/client'
import {useSyncExternalStore} from 'react'

import {client} from './client'
import {type Ordering} from './DocumentList'
import {type Perspective} from './perspective'
import {type DocPreview, previewFromDocument} from './preview-data'
import {schema} from './schema'
import {Atom, Emitter} from './state'
import {type JsonObject, previewText, sleep} from './util'

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
  /** The warm-up pass of its type that last saw the document. */
  pass: number
  created: number
  updated: number
  /** Length of the JSON text. */
  len: number
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
  lastUsed: number
}

interface TypeState {
  name: string
  titleField: string | undefined
  /** The whole type was fetched once, so its index is complete. */
  complete: boolean
  skipped: boolean
  pass: number
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
    (doc.body === undefined ? 0 : Math.round(doc.len * OBJECT_FACTOR))
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

const queue: number[] = []
let workers = 0
let started = 0
let full = false
let welcomed = false
const wanted = new Map<string, number>()
let pending: string[] = []
const inFlight = new Set<string>()
let fetches = 0

/** Per type: changes of what lists sort and filter on, and of anything a row shows. */
const lists = new Emitter()
const rows = new Emitter()
const listGenerations = new Map<string, number>()
const rowGenerations = new Map<string, number>()

function budgetFromUrl(): number {
  const value = Number(new URLSearchParams(window.location.search).get('cache') ?? Number.NaN)
  const mib = Number.isFinite(value) && value >= 0 ? value : DEFAULT_BUDGET_MIB
  return Math.floor(mib * 1024 * 1024)
}

const budget = budgetFromUrl()

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
  }
  const changed = (Object.keys(next) as (keyof CacheStatus)[]).some(
    (key) => next[key] !== previous[key],
  )
  if (!changed) return
  ;(window as unknown as {__studioCache: CacheStatus}).__studioCache = next
  status.set(next)
}

/** Stores a document; `keep` is false for one too large to keep the body of. Returns its type,
 * and whether what lists sort and filter on changed. */
function insert(doc: JsonObject, len: number, keep: boolean): [number, boolean] | undefined {
  const type = typeof doc._type === 'string' ? typeIndex.get(doc._type) : undefined
  if (type === undefined || typeof doc._id !== 'string') return undefined
  const [published, kind] = parseId(doc._id)
  const state = types[type]
  const title = state.titleField ? previewText(doc[state.titleField]) : undefined
  const next: CachedDoc = {
    kind,
    pass: state.pass,
    created: seconds(doc._createdAt),
    updated: seconds(doc._updatedAt),
    len,
    title: title?.toLowerCase(),
    body: keep ? doc : undefined,
  }
  let added = docCost(next)
  if (next.body) {
    bodies++
    jsonBytes += len
  }
  let group = groups.get(published)
  if (!group) {
    added += groupCost(published)
    group = {docs: [], type, known: state.complete, lastUsed: 0}
    groups.set(published, group)
  }
  group.type = type
  let removed = 0
  let listed = true
  const index = group.docs.findIndex((existing) => sameKind(existing.kind, kind))
  if (index === -1) group.docs.push(next)
  else {
    const existing = group.docs[index]
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
  return group.type
}

/** Marks a type warmed, after a pass that fetched all of it: every group is known, and documents
 * the pass did not see (deleted while the replica was not listening) go. */
function completeType(type: number, pass: number, since: number): void {
  types[type].complete = true
  const stale: string[] = []
  for (const [published, group] of groups) {
    if (group.type !== type) continue
    group.known = true
    for (const doc of group.docs) if (doc.pass < pass) stale.push(rawId(published, doc.kind))
  }
  for (const id of stale) if ((touched.get(id) ?? 0) <= since) remove(id)
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
      bytes -= Math.round(doc.len * OBJECT_FACTOR)
      bodies--
      jsonBytes -= doc.len
      doc.body = undefined
    }
    evictions++
  }
  return [...evicted]
}

function lengthOf(doc: JsonObject): number {
  return JSON.stringify(doc).length
}

function onEvent(event: {
  type: string
  documentId?: string
  result?: SanityDocument
  transition?: string
}): void {
  if (event.type === 'welcome') {
    if (welcomed) {
      // Events may have been missed: warm every type again, keeping what is cached.
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
}

/** Opens the listener for every document type of the schema and warms up once it is open. */
export function startReplica(): void {
  if (started) return
  started = performance.now()
  for (const def of schema().documentTypes) {
    typeIndex.set(def.name, types.length)
    types.push({
      name: def.name,
      titleField: schema().preview(def.name).title,
      complete: false,
      skipped: false,
      pass: 0,
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
  while (workers < WARM_WORKERS && queue.length > 0) {
    workers++
    void warmWorker()
  }
  updateStatus()
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

async function warmWorker(): Promise<void> {
  for (;;) {
    const type = queue.shift()
    if (type === undefined || full) break
    await warmType(type)
  }
  workers--
  updateStatus()
}

/** Fetches every document of a type in pages ordered by id, small at first so a type of large
 * documents is noticed early, then sized to about `PAGE_BYTES`. */
async function warmType(type: number): Promise<void> {
  const state = types[type]
  state.pass++
  state.skipped = false
  const pass = state.pass
  const since = seq
  let after = ''
  let size = FIRST_PAGE
  // Only the documents small enough to keep count towards the average, so one huge document
  // neither skips a type of small ones nor shrinks its pages.
  let seen = 0
  let kept = 0
  let keptBytes = 0
  for (;;) {
    if (!wouldFit(size, kept > 0 ? keptBytes / kept : undefined)) {
      full = true
      queue.length = 0
      updateStatus()
      return
    }
    const page = await queryPage(
      `*[_type == $type && _id > $after] | order(_id) [0...${size}]`,
      {type: state.name, after},
      'replica.warm',
    )
    if (!page) return
    for (const doc of page) {
      const len = lengthOf(doc)
      const keep = len <= DOC_LIMIT
      seen++
      if (keep) {
        kept++
        keptBytes += len
      }
      if (typeof doc._id !== 'string') continue
      after = doc._id
      if ((touched.get(doc._id) ?? 0) > since) continue
      insert(doc, len, keep)
    }
    if (page.length < size) completeType(type, pass, since)
    else if (seen >= FIRST_PAGE && (kept === 0 || keptBytes / kept > TYPE_AVERAGE_LIMIT))
      state.skipped = true
    bump(type)
    updateStatus()
    if (page.length < size || (state.complete && state.pass === pass) || state.skipped) return
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
    for (const doc of page) {
      if (typeof doc._id !== 'string' || (touched.get(doc._id) ?? 0) > since) continue
      const result = insert(doc, lengthOf(doc), true)
      if (result) mark(...result)
    }
    for (const id of ids) {
      // The rows that asked for the groups show them now, so they are the last to evict.
      clock++
      const group = groups.get(id)
      if (group) {
        group.known = true
        group.lastUsed = clock
        mark(group.type, false)
      } else {
        groups.set(id, {docs: [], type: -1, known: true, lastUsed: clock})
        bytes += groupCost(id)
      }
    }
    for (const type of evict()) mark(type, false)
    fetchedCount += ids.length
  } else {
    // Asked for again by the rows that still show them.
    pending.push(...ids)
  }
  for (const id of ids) inFlight.delete(id)
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

/** Asks for the documents of a group a row shows a skeleton for, until `unwant`. */
export function want(published: string): void {
  const count = (wanted.get(published) ?? 0) + 1
  wanted.set(published, count)
  if (count > 1) return
  pending.push(published)
  pump()
}

export function unwant(published: string): void {
  const count = (wanted.get(published) ?? 0) - 1
  if (count > 0) wanted.set(published, count)
  else wanted.delete(published)
}

/** The row preview of a cached group as `perspective` shows it. */
export function cachedPreview(published: string, perspective: Perspective): DocPreview | undefined {
  const group = groups.get(published)
  if (!group || !complete(group)) return undefined
  group.lastUsed = ++clock
  const doc = shownDoc(group, perspective)
  if (!doc?.body) return undefined
  return previewFromDocument(published, doc.body, doc.kind !== 'published')
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
 * (`null` when missing) and every release version, by id, and the ids of the versions. */
export interface Seed {
  docs: [string, JsonObject | null][]
  versions: string[]
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
  return {docs, versions}
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
  const started = performance.now()
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
  lastList = performance.now() - started
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
