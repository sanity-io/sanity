import {type SanityClient} from '@sanity/client'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {
  type AudienceVersion,
  DEFINITIONS_GROQ,
  RELEASES_GROQ,
  type RawVersionRow,
  type ReleaseInfo,
  toVersions,
} from './versions'

// One request serves every row on screen: rows ask for their document group in the same tick, a short timer
// batches them into one query, and the definitions and releases are cached for a few seconds.
const BATCH_MS = 30
const CACHE_MS = 8_000

type Waiter = (rows: RawVersionRow[]) => void
type Lookup = {definitions: Map<string, string>; releases: Map<string, ReleaseInfo>; at: number}

interface Loader {
  load: (id: string) => Promise<AudienceVersion[]>
}

const loaders = new Map<string, Loader>()
/** Each document's last version list, by project, dataset and document. */
const latest = new Map<string, AudienceVersion[]>()

const ROWS_BY_IDS_GROQ = `*[string::split(_id, ".")[-1] in $ids]{
  _id, "variant": _system.variant._ref, "bundle": _system.bundleId, _createdAt, _updatedAt
}`

/**
 * Tells every reader of a document group when a document of that group changes: its draft, its published version, a release version or a
 * variant version (the same documents `VERSION_ROWS_GROQ` lists). One listener per group, shared by the pills, the banner and the inventory,
 * closed with its last reader. A burst of changes (typing) is one refetch, 800 ms after it ends: the list is rows and dates, not keystrokes.
 * Before this the list refetched only when the window regained focus, so a document's first change (which creates its draft) never showed
 * in the inventory (Faheem, 26 Oct: "even though it was saved, the version inventory doesn't update").
 */
const GROUP_FILTER = `*[_id in [$id, "drafts." + $id] || _system.group._ref == $id || _id match "versions.*." + $id]`
const WATCH_MS = 800
const watchers = new Map<string, {readers: Set<() => void>; stop: () => void}>()

function watchGroup(client: SanityClient, key: string, id: string, onChange: () => void) {
  let watcher = watchers.get(key)
  if (!watcher) {
    const readers = new Set<() => void>()
    let timer: ReturnType<typeof setTimeout> | undefined
    const subscription = client
      .listen(
        GROUP_FILTER,
        {id},
        {
          events: ['mutation'],
          includeAllVersions: true,
          includeResult: false,
          tag: 'handoff.versions',
          visibility: 'query',
        },
      )
      .subscribe({
        next: () => {
          clearTimeout(timer)
          timer = setTimeout(() => readers.forEach((reader) => reader()), WATCH_MS)
        },
        // The list still refreshes on window focus when the listener cannot connect.
        error: () => undefined,
      })
    watcher = {
      readers,
      stop: () => {
        clearTimeout(timer)
        subscription.unsubscribe()
      },
    }
    watchers.set(key, watcher)
  }
  watcher.readers.add(onChange)
  const mine = watcher
  return () => {
    mine.readers.delete(onChange)
    if (mine.readers.size === 0) {
      mine.stop()
      watchers.delete(key)
    }
  }
}

function createLoader(client: SanityClient): Loader {
  let lookup: Promise<Lookup> | undefined
  let lookupAt = 0
  const waiting = new Map<string, Waiter[]>()
  let timer: ReturnType<typeof setTimeout> | undefined

  const getLookup = () => {
    if (!lookup || Date.now() - lookupAt > CACHE_MS) {
      lookupAt = Date.now()
      lookup = Promise.all([client.fetch(DEFINITIONS_GROQ), client.fetch(RELEASES_GROQ)]).then(
        ([defs, rels]: [Array<{id: string; title: string}>, ReleaseInfo[]]) => ({
          definitions: new Map(defs.map((d) => [d.id, d.title])),
          releases: new Map(rels.map((r) => [r.id, r])),
          at: Date.now(),
        }),
      )
    }
    return lookup
  }

  const flush = async () => {
    timer = undefined
    const batch = new Map(waiting)
    waiting.clear()
    const ids = [...batch.keys()]
    try {
      const rows: RawVersionRow[] = await client.fetch(ROWS_BY_IDS_GROQ, {ids})
      for (const [id, waiters] of batch) {
        const mine = rows.filter((r) => r._id.split('.').at(-1) === id)
        for (const w of waiters) w(mine)
      }
    } catch (error) {
      for (const waiters of batch.values())
        for (const w of waiters) w(Promise.reject(error) as never)
    }
  }

  return {
    async load(id) {
      const rowsPromise = new Promise<RawVersionRow[]>((resolve) => {
        waiting.set(id, [...(waiting.get(id) ?? []), resolve])
        timer ??= setTimeout(flush, BATCH_MS)
      })
      const [rows, {definitions, releases}] = await Promise.all([rowsPromise, getLookup()])
      return toVersions(id, rows, {definitions, releases})
    },
  }
}

/**
 * The versions of one document group, live from the dataset (raw perspective, so drafts, release versions and
 * variant versions all show). `null` while loading. Refetches on window focus, and when a document of the group changes.
 */
export function useVersionList(documentId: string, enabled = true): AudienceVersion[] | null {
  const studioClient = useClient({apiVersion: 'X'})
  const {projectId, dataset} = studioClient.config()
  const cacheKey = `${projectId}/${dataset}/${documentId}`
  // A document's last list seeds a new reader, so a panel opened after the pills have loaded (the inventory) has it in its first render,
  // and decisions made from it (the T6 banner case) are known before first paint. It is refreshed as before.
  const [versions, setVersions] = useState<AudienceVersion[] | null>(
    () => latest.get(cacheKey) ?? null,
  )

  useEffect(() => {
    if (!enabled) return undefined
    const {projectId, dataset} = studioClient.config()
    const key = `${projectId}/${dataset}`
    let loader = loaders.get(key)
    if (!loader) {
      loader = createLoader(
        studioClient.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
      )
      loaders.set(key, loader)
    }
    let cancelled = false
    const run = () =>
      loader!
        .load(documentId)
        .then((next) => {
          latest.set(`${key}/${documentId}`, next)
          return !cancelled && setVersions(next)
        })
        .catch(() => !cancelled && setVersions([]))
    void run()
    window.addEventListener('focus', run)
    const unwatch = watchGroup(
      studioClient.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
      `${key}/${documentId}`,
      documentId,
      run,
    )
    return () => {
      cancelled = true
      window.removeEventListener('focus', run)
      unwatch()
    }
  }, [studioClient, documentId, enabled])

  return versions
}
