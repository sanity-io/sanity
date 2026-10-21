import {type SanityClient} from '@sanity/client'
import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {
  type AudienceVersion,
  DEFINITIONS_GROQ,
  inOpenBeta,
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

const ROWS_BY_IDS_GROQ = `*[string::split(_id, ".")[-1] in $ids]{
  _id, "variant": _system.variant._ref, "bundle": _system.bundleId, _createdAt, _updatedAt
}`

function createLoader(client: SanityClient): Loader {
  let lookup: Promise<Lookup> | undefined
  let lookupAt = 0
  const waiting = new Map<string, Waiter[]>()
  let timer: ReturnType<typeof setTimeout> | undefined

  const getLookup = () => {
    if (!lookup || Date.now() - lookupAt > CACHE_MS) {
      lookupAt = Date.now()
      lookup = Promise.all([client.fetch(DEFINITIONS_GROQ), client.fetch(RELEASES_GROQ)]).then(
        ([defs, rels]: [
          Array<{id: string; title: string; conditions?: Record<string, unknown>}>,
          ReleaseInfo[],
        ]) => ({
          definitions: new Map(
            defs.filter((d) => inOpenBeta(d.conditions)).map((d) => [d.id, d.title]),
          ),
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
 * variant versions all show). `null` while loading. Refetches on window focus.
 */
export function useVersionList(documentId: string, enabled = true): AudienceVersion[] | null {
  const studioClient = useClient({apiVersion: 'X'})
  const [versions, setVersions] = useState<AudienceVersion[] | null>(null)

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
        .then((next) => !cancelled && setVersions(next))
        .catch(() => !cancelled && setVersions([]))
    void run()
    window.addEventListener('focus', run)
    return () => {
      cancelled = true
      window.removeEventListener('focus', run)
    }
  }, [studioClient, documentId, enabled])

  return versions
}
