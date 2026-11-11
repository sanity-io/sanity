/**
 * The document store, built the way the JS studio's is: one `BufferedDocument` from
 * `@sanity/mutator` per document (draft, published document, release versions), fed by a pair
 * listener whose events are put in revision order first (`sequentializeListenerEvents`), and
 * committing through `/data/mutate` with the squashed, diff-match-patch optimised mutations the
 * mutator produces. Server actions (publish, discard, ...) go through `/data/actions` once
 * everything before them is saved, as the JS studio's operations do.
 */
import {type MutationEvent, type SanityDocument, type WelcomeEvent} from '@sanity/client'
import {BufferedDocument, type Mut, Mutation} from '@sanity/mutator'
import {useCallback, useSyncExternalStore} from 'react'
import {type Subscription} from 'rxjs'

import {client, statusCode} from './client'
import {type Perspective} from './perspective'
import {schema} from './schema'
import {Atom, Emitter} from './state'
import {toastError} from './toasts'
import {
  draftId,
  type JsonObject,
  publishedId,
  releaseOf,
  stripSystemFields,
  uuid,
  versionId,
} from './util'

export type SyncState = 'saved' | 'saving' | 'error'

/** A message for the inputs that keep their own copy of a value (the Portable Text editor). */
export interface PatchMessage {
  type: 'mutation' | 'rebase'
  snapshot: JsonObject | null
  patches: MutationPatch[]
}

/** A patch operation of a mutation (`{set: {...}}`, `{insert: {...}}`, ...) and its origin. */
export interface MutationPatch {
  origin: 'local' | 'remote'
  patch: Record<string, unknown>
}

interface Entry {
  id: string
  buffered: BufferedDocument | undefined
  /** The revision the buffered document's HEAD is at, for putting listener events in order. */
  rev: string | undefined
  /** Listener events that don't apply to the current revision yet. */
  pending: MutationEvent[]
  pendingSince: number | undefined
  gapTimer: ReturnType<typeof setTimeout> | undefined
  loading: boolean
}

interface Pair {
  refs: number
  session: number
  subscription: Subscription
  versions: Set<string>
  versionsLoaded: boolean
}

/** How long, and for how many events, a gap in the revision chain is waited out before the
 * documents are fetched again (`sequentializeListenerEvents`' defaults). */
const GAP_DEADLINE_MS = 30_000
const GAP_MAX_EVENTS = 20
/** Edits are committed after this long without another edit. */
const COMMIT_DELAY_MS = 250
/** `TERMINAL_COMMIT_STATUSES` of `checkoutPair`: the same commit can never succeed. */
const TERMINAL = new Set([400, 401, 402, 403, 404, 409, 410, 412, 413, 422])

const entries = new Map<string, Entry>()
const pairs = new Map<string, Pair>()
const changes = new Emitter()
/** How many times each id has changed, the snapshot `useDocuments` re-renders on. */
const generations = new Map<string, number>()
const patchListeners = new Map<string, Set<(message: PatchMessage) => void>>()
/** The initial values of new documents that no edit has created yet, by published id. */
const newDocuments = new Map<string, JsonObject>()
let nextSession = 0
let commitTimer: ReturnType<typeof setTimeout> | undefined
let failed = false

export const syncState = new Atom<SyncState>('saved')
export const connected = new Atom(true)
/** Round trip of the last commit and time from listener to snapshots, for the performance panel. */
export const lastCommitMs = new Atom<number | undefined>(undefined)
export const lastLoadMs = new Atom<number | undefined>(undefined)

function versionsKey(published: string): string {
  return `versions-of:${published}`
}

function entry(id: string): Entry {
  let found = entries.get(id)
  if (!found) {
    found = {
      id,
      buffered: undefined,
      rev: undefined,
      pending: [],
      pendingSince: undefined,
      gapTimer: undefined,
      loading: false,
    }
    entries.set(id, found)
  }
  return found
}

function notify(id: string): void {
  bump(id)
  const release = releaseOf(id)
  if (release) bump(versionsKey(publishedId(id)))
}

function bump(id: string): void {
  generations.set(id, (generations.get(id) ?? 0) + 1)
  changes.emit(id)
}

function publish(id: string, message: PatchMessage): void {
  const listeners = patchListeners.get(id)
  if (!listeners) return
  for (const listener of [...listeners]) listener(message)
}

/** Subscribes to the mutations and rebases of document `id`, for the Portable Text editor. */
export function subscribePatches(
  id: string,
  listener: (message: PatchMessage) => void,
): () => void {
  let set = patchListeners.get(id)
  if (!set) {
    set = new Set()
    patchListeners.set(id, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
  }
}

function patchesOf(mutations: Mut[], origin: 'local' | 'remote'): MutationPatch[] {
  return mutations.flatMap((mutation) => {
    const patch = (mutation as {patch?: Record<string, unknown>}).patch
    return patch ? [{origin, patch}] : []
  })
}

function busy(buffered: BufferedDocument): boolean {
  return buffered.buffer.hasChanges() || buffered.committerRunning
}

function updateSyncState(): void {
  let saving = commitTimer !== undefined
  for (const {buffered} of entries.values()) {
    if (buffered && busy(buffered)) {
      saving = true
      break
    }
  }
  syncState.set(saving ? 'saving' : failed ? 'error' : 'saved')
}

function createBuffered(target: Entry, doc: JsonObject | null): BufferedDocument {
  const buffered = new BufferedDocument(doc as never)
  buffered.onMutation = ({mutation, document, remote}) => {
    notify(target.id)
    publish(target.id, {
      type: 'mutation',
      snapshot: document as JsonObject | null,
      patches: patchesOf(mutation.mutations, remote ? 'remote' : 'local'),
    })
  }
  buffered.onRebase = (document, remoteMutations, localMutations) => {
    notify(target.id)
    publish(target.id, {
      type: 'rebase',
      snapshot: document as JsonObject | null,
      patches: [...patchesOf(remoteMutations, 'remote'), ...patchesOf(localMutations, 'local')],
    })
  }
  buffered.onConsistencyChanged = () => updateSyncState()
  buffered.commitHandler = ({mutation, success, failure, cancel}) => {
    const started = performance.now()
    const {mutations, transactionId} = mutation.params
    client()
      .mutate(mutations as never, {
        transactionId,
        visibility: 'async',
        returnDocuments: false,
        autoGenerateArrayKeys: true,
        skipCrossDatasetReferenceValidation: true,
        tag: 'document.commit',
      })
      .then(
        () => {
          failed = false
          lastCommitMs.set(performance.now() - started)
          success()
          updateSyncState()
        },
        (error: unknown) => {
          failed = true
          const status = statusCode(error)
          toastError('Could not save your changes', error)
          if (status !== undefined && TERMINAL.has(status)) cancel(error as Error)
          else failure()
          notify(target.id)
          updateSyncState()
        },
      )
  }
  return buffered
}

/** The document `id` as this client sees it: `undefined` until loaded, `null` when missing. */
export function local(id: string): JsonObject | null | undefined {
  const found = entries.get(id)
  if (!found?.buffered) return undefined
  return found.buffered.LOCAL as JsonObject | null
}

export function isLoaded(id: string): boolean {
  return entries.get(id)?.buffered !== undefined
}

export function subscribe(id: string, listener: () => void): () => void {
  return changes.subscribe(id, listener)
}

/** The initial value a new document shows until its first edit creates it. */
export function initialValue(published: string): JsonObject | undefined {
  return newDocuments.get(published)
}

/** The ids of the release versions of `published` its listener has seen. */
export function versionIds(published: string): string[] {
  return [...(pairs.get(published)?.versions ?? [])]
}

/** The releases `published` has a version in. */
export function versions(published: string): string[] {
  return versionIds(published)
    .filter((id) => local(id))
    .flatMap((id) => {
      const release = releaseOf(id)
      return release ? [release] : []
    })
}

/** Whether the versions of `published` are known and loaded. */
export function versionsReady(published: string): boolean {
  const pair = pairs.get(published)
  if (!pair?.versionsLoaded) return false
  return [...pair.versions].every(isLoaded)
}

/**
 * The document as `perspective` shows it: a release shows its version, or the draft or published
 * document while it has none, like the release stacked on the drafts.
 */
export function shown(published: string, perspective: Perspective): JsonObject | null | undefined {
  const draft = () => local(draftId(published))
  const pick = (...values: (JsonObject | null | undefined)[]) => {
    for (const value of values) if (value) return value
    return values.some((value) => value === undefined) ? undefined : null
  }
  switch (perspective.kind) {
    case 'published':
      return local(published)
    case 'drafts':
      return pick(draft(), local(published))
    case 'release':
      return pick(local(versionId(perspective.name, published)), draft(), local(published))
    default: {
      const exhaustive: never = perspective
      return exhaustive
    }
  }
}

/** Re-renders when any of `ids` changes, or the release versions of `versionsOf` or their list. */
export function useDocuments<T>(ids: string[], read: () => T, versionsOf?: string): T {
  const key = ids.join('|') + (versionsOf ? `|${versionsKey(versionsOf)}` : '')
  const subscribeAll = useCallback(
    (listener: () => void) => {
      const keys = key.split('|')
      const unsubscribes = keys.map((id) => changes.subscribe(id, listener))
      return () => {
        for (const unsubscribe of unsubscribes) unsubscribe()
      }
    },
    [key],
  )
  const snapshot = useCallback(
    () =>
      key
        .split('|')
        .map((id) => generations.get(id) ?? 0)
        .join('|'),
    [key],
  )
  const generation = useSyncExternalStore(subscribeAll, snapshot, snapshot)
  return readAt(generation, read)
}

/** The React Compiler memoizes a call on its arguments, so `read()` must take the generation of
 * the documents it reads to run again when they change. */
function readAt<T>(_generation: string, read: () => T): T {
  return read()
}

/** Opens the listener for the draft/published pair of `published` unless it is open already. */
export function open(published: string): () => void {
  const existing = pairs.get(published)
  if (existing) {
    existing.refs++
    return () => release(published)
  }
  const session = nextSession++
  const ids = [draftId(published), published]
  const started = performance.now()
  // Versions only reach a listener that asks for them, whatever its query matches.
  const subscription = client()
    .listen('*[_id in $ids || sanity::versionOf($id)]', {ids, id: published}, {
      includeResult: false,
      includeAllVersions: true,
      events: ['welcome', 'mutation', 'reconnect'],
      visibility: 'transaction',
      tag: 'document.pair-listener',
    } as never)
    .subscribe({
      next: (event) => onPairEvent(published, session, ids, event as never, started),
      error: (error: unknown) => toastError('The document listener stopped', error),
    })
  pairs.set(published, {refs: 1, session, subscription, versions: new Set(), versionsLoaded: false})
  return () => release(published)
}

function release(published: string): void {
  const pair = pairs.get(published)
  if (!pair) return
  if (pair.refs > 1) {
    pair.refs--
    return
  }
  pair.subscription.unsubscribe()
  pairs.delete(published)
  // Without a listener the snapshots would go stale; edits still in flight keep theirs.
  for (const id of [draftId(published), published, ...pair.versions]) {
    const found = entries.get(id)
    const buffered = found?.buffered
    if (!buffered) continue
    if (busy(buffered)) continue
    entries.delete(id)
  }
}

function currentPair(published: string, session: number): Pair | undefined {
  const pair = pairs.get(published)
  return pair && pair.session === session ? pair : undefined
}

function onPairEvent(
  published: string,
  session: number,
  ids: string[],
  event: WelcomeEvent | MutationEvent | {type: 'reconnect'},
  started: number,
): void {
  const pair = currentPair(published, session)
  if (!pair) return
  switch (event.type) {
    case 'welcome': {
      connected.set(true)
      const all = [...ids, ...pair.versions]
      void loadSnapshots(published, session, all).then(() =>
        lastLoadMs.set(performance.now() - started),
      )
      void loadVersions(published, session)
      break
    }
    case 'reconnect':
      connected.set(false)
      break
    case 'mutation': {
      const id = event.documentId
      if (releaseOf(id) && !pair.versions.has(id)) {
        pair.versions.add(id)
        notify(versionsKey(published))
      }
      const target = entry(id)
      target.pending.push(event)
      if (!target.buffered && !target.loading) {
        void loadSnapshots(published, session, [id])
        return
      }
      drain(target, published, session)
      break
    }
    default:
  }
}

/**
 * Applies the pending events of `target` that continue its revision chain, discards the ones its
 * snapshot already contains, and fetches the document again when a gap doesn't close.
 */
function drain(target: Entry, published: string, session: number): void {
  const buffered = target.buffered
  if (!buffered || target.loading) return
  discardApplied(target)
  for (;;) {
    const index = target.pending.findIndex((event) => event.previousRev === target.rev)
    if (index === -1) break
    const [event] = target.pending.splice(index, 1)
    target.rev = event.transition === 'disappear' ? undefined : event.resultRev
    buffered.arrive(
      new Mutation({
        mutations: event.mutations as Mut[],
        transactionId: event.transactionId,
        transition: event.transition,
        identity: event.identity,
        previousRev: event.previousRev,
        resultRev: event.resultRev,
        timestamp: event.timestamp,
      }),
    )
    notify(target.id)
  }
  if (target.pending.length === 0) {
    target.pendingSince = undefined
    return
  }
  const now = performance.now()
  target.pendingSince ??= now
  if (target.pending.length > GAP_MAX_EVENTS || now - target.pendingSince > GAP_DEADLINE_MS) {
    void loadSnapshots(published, session, [target.id])
    return
  }
  target.gapTimer ??= setTimeout(() => {
    target.gapTimer = undefined
    if (currentPair(published, session) && target.pending.length > 0)
      drain(target, published, session)
  }, GAP_DEADLINE_MS + 10)
}

/** Drops the events that lead up to the current revision: the snapshot has them already. */
function discardApplied(target: Entry): void {
  let rev = target.rev
  while (rev !== undefined) {
    const index = target.pending.findIndex((event) => event.resultRev === rev)
    if (index === -1) break
    const [event] = target.pending.splice(index, 1)
    rev = event.previousRev
  }
}

/** Fetches the snapshots of `ids` and resets their buffered documents to them. */
async function loadSnapshots(published: string, session: number, ids: string[]): Promise<void> {
  const targets = ids.map(entry)
  for (const target of targets) target.loading = true
  let docs: (SanityDocument | null)[]
  try {
    docs = await client().getDocuments(ids, {tag: 'document.snapshots'})
  } catch (error) {
    for (const target of targets) target.loading = false
    toastError('Could not load the document', error)
    return
  }
  if (!currentPair(published, session)) {
    for (const target of targets) target.loading = false
    return
  }
  targets.forEach((target, index) => {
    const doc = (docs[index] ?? null) as JsonObject | null
    target.loading = false
    target.rev = typeof doc?._rev === 'string' ? doc._rev : undefined
    target.pendingSince = undefined
    if (target.buffered) target.buffered.reset(doc as never)
    else target.buffered = createBuffered(target, doc)
    notify(target.id)
    drain(target, published, session)
  })
}

/** Finds the release versions of an open document, which its listener only reports once they
 * change, and loads their snapshots. */
async function loadVersions(published: string, session: number): Promise<void> {
  let ids: string[] = []
  try {
    ids = await client().fetch<string[]>(
      '*[sanity::versionOf($id) && _id in path("versions.**")]._id',
      {id: published},
      {perspective: 'raw', tag: 'document.versions'},
    )
  } catch {
    // A failed query leaves the versions the listener reports, rather than a pane that waits for
    // them forever.
  }
  const pair = currentPair(published, session)
  if (!pair) return
  pair.versionsLoaded = true
  const fresh = ids.filter((id) => !pair.versions.has(id))
  for (const id of fresh) pair.versions.add(id)
  notify(versionsKey(published))
  if (fresh.length > 0) await loadSnapshots(published, session, fresh)
  notify(versionsKey(published))
}

function scheduleCommit(delay: number): void {
  if (commitTimer !== undefined) clearTimeout(commitTimer)
  commitTimer = setTimeout(() => {
    commitTimer = undefined
    for (const {buffered} of entries.values()) {
      if (buffered?.buffer.hasChanges()) void buffered.commit().catch(() => undefined)
    }
    updateSyncState()
  }, delay)
  updateSyncState()
}

/** Sends everything buffered and waits until no commit is in flight. */
export async function flush(): Promise<void> {
  if (commitTimer !== undefined) {
    clearTimeout(commitTimer)
    commitTimer = undefined
  }
  // A commit that keeps failing is retried by the mutator; the action then runs against what the
  // server has.
  const deadline = performance.now() + 30_000
  while (performance.now() < deadline) {
    const pending = [...entries.values()].flatMap(({buffered}) =>
      buffered && busy(buffered) ? [buffered] : [],
    )
    if (pending.length === 0) break
    await Promise.all(pending.map((buffered) => buffered.commit().catch(() => undefined)))
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  updateSyncState()
}

function add(id: string, mutations: Mut[]): void {
  const target = entry(id)
  if (!target.buffered) target.buffered = createBuffered(target, null)
  // The timestamp becomes the local `_updatedAt`, as in the Rust studio, so lists sorted by it
  // and "edited just now" follow an edit before the listener echoes it.
  target.buffered.add(new Mutation({mutations, timestamp: new Date().toISOString()}))
}

/** The document a missing draft or version `target` is created from: the version a release
 * starts from is the draft, or the published document, as in the JS studio. */
function baseFor(target: string, published: string, typeName: string): JsonObject | undefined {
  if (local(target)) return undefined
  const draft = draftId(published)
  const source =
    (target !== draft ? local(draft) : undefined) ??
    local(published) ??
    newDocuments.get(published) ??
    ({_type: typeName} as JsonObject)
  return stripSystemFields(source, target)
}

/** Patch operations (`{set: {...}}`, `{unset: [...]}`, ...) on the draft of `published`, or on
 * its version in `release`, created from the document as it is now first when there is none. */
export function edit(
  published: string,
  typeName: string,
  release: string | undefined,
  ops: JsonObject[],
): void {
  const target = release ? versionId(release, published) : draftId(published)
  const base = baseFor(target, published, typeName)
  const mutations: Mut[] = []
  if (base) mutations.push({createIfNotExists: base} as Mut)
  for (const op of ops) mutations.push({patch: {id: target, ...op}} as Mut)
  add(target, mutations)
  scheduleCommit(COMMIT_DELAY_MS)
}

/** Adds the document to `release` as it is now, like the JS studio's "Add to release". */
export function addToRelease(published: string, typeName: string, release: string): void {
  const target = versionId(release, published)
  const base = baseFor(target, published, typeName)
  if (!base) return
  add(target, [{createIfNotExists: base} as Mut])
  scheduleCommit(0)
}

/** Replaces the draft (or the version in `release`) with `revision`, an earlier revision of the
 * document, like the JS studio's "Restore" in the history inspector. */
export function restore(
  published: string,
  release: string | undefined,
  revision: JsonObject,
): void {
  const target = release ? versionId(release, published) : draftId(published)
  const doc = stripSystemFields(revision, target)
  // The history API adds the revision's system metadata, which isn't document content.
  for (const key of Object.keys(doc)) if (key.startsWith('_system')) delete doc[key]
  add(target, [{createOrReplace: doc} as Mut])
  scheduleCommit(0)
}

/**
 * Picks the id of a new document and returns it. Without `initial`, the document shows the
 * initial value of its type, and nothing is written until the first edit creates the draft, so
 * an abandoned new document leaves no trace.
 */
export function create(typeName: string, initial?: JsonObject): string {
  const published = uuid()
  const draft = draftId(published)
  for (const id of [draft, published]) {
    const target = entry(id)
    if (!target.buffered) target.buffered = createBuffered(target, null)
  }
  if (initial) {
    add(draft, [{create: {...initial, _id: draft, _type: typeName}} as Mut])
    scheduleCommit(0)
  } else {
    const value = schema().initialDocument(typeName)
    if (value) newDocuments.set(published, value)
  }
  return published
}

/** Copies the current version of a document into a new draft and returns its published id. */
export function duplicate(published: string, typeName: string): string | undefined {
  const source = local(draftId(published)) ?? local(published)
  if (!source) return undefined
  return create(typeName, stripSystemFields(source, ''))
}

async function action(action: JsonObject): Promise<boolean> {
  await flush()
  try {
    await client().action(action as never, {tag: 'document.commit', transactionId: uuid()} as never)
    return true
  } catch (error) {
    toastError('The action failed', error)
    return false
  }
}

export function publishDocument(published: string): Promise<boolean> {
  return action({
    actionType: 'sanity.action.document.publish',
    draftId: draftId(published),
    publishedId: published,
  })
}

export function discardDraft(published: string): Promise<boolean> {
  return action({actionType: 'sanity.action.document.discard', draftId: draftId(published)})
}

export function unpublish(published: string): Promise<boolean> {
  return action({
    actionType: 'sanity.action.document.unpublish',
    draftId: draftId(published),
    publishedId: published,
  })
}

export function deleteDocument(published: string): Promise<boolean> {
  return action({
    actionType: 'sanity.action.document.delete',
    publishedId: published,
    includeDrafts: [draftId(published)],
  })
}

/** Removes the document from `release`, through the Actions API like the JS studio. */
export function discardVersion(published: string, release: string): Promise<boolean> {
  return action({
    actionType: 'sanity.action.document.version.discard',
    versionId: versionId(release, published),
  })
}

/** Runs a release action (create, archive, ...) after everything before it is saved. */
export function releaseAction(actionBody: JsonObject): Promise<boolean> {
  return action(actionBody)
}

export {publishedId}
