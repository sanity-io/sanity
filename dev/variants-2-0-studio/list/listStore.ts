import {useEffect, useMemo, useSyncExternalStore} from 'react'
import {useClient} from 'sanity'

import {deepEqual, type Json} from '../fieldmarks/markModel'

// Data for the E9 list work: which documents of a list differ from their base for one variant ("Returning visitors against Base"),
// and the review pass held in the list pane (reviewPass C). Module stores, so the rows, the header and the pane agree.

// ---- Which documents differ from the base ----------------------------------------------------------------------------

export type DiffMap = Map<string, {differs: boolean}>

const maps = new Map<string, DiffMap>()
const loading = new Set<string>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}
const baseId = (id: string) => id.replace(/^(drafts\.|versions\.[^.]+\.)/, '')

/** The variant (short id) whose definition names exactly the chosen values, or null. */
export function exactVariantId(
  chosen: Record<string, string>,
  definitions: readonly {_id: string; conditions: Record<string, string>}[],
): string | null {
  const entries = Object.entries(chosen)
  if (!entries.length) return null
  const exact = definitions.find((d) => {
    const own = Object.entries(d.conditions)
    return own.length === entries.length && own.every(([name, key]) => chosen[name] === key)
  })
  return exact ? exact._id.replace(/^_\.variants\./, '') : null
}

/** For every document of `type` that has the variant: does it differ from the base? (Raw, API version X; the published versions are compared.) */
export function useDiffMap(type: string | undefined, variantId: string | null): DiffMap | null {
  const base = useClient({apiVersion: 'X'})
  const client = useMemo(
    () => base.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
    [base],
  )
  const key = type && variantId ? `${type}|${variantId}` : ''
  useEffect(() => {
    if (!key || !type || !variantId || loading.has(key)) return
    loading.add(key)
    void Promise.all([
      client.fetch('*[_type == $type && !(_id match "drafts.*") && !(_id match "versions.*")]', {
        type,
      }) as Promise<Record<string, Json>[]>,
      client.fetch(
        '*[_type == $type && _system.variant._ref == $vref && !defined(_system.bundleId)]',
        {type, vref: `_.variants.${variantId}`},
      ) as Promise<Record<string, Json>[]>,
    ])
      .then(([bases, variants]) => {
        const byId = new Map(bases.map((d) => [String(d._id), d]))
        const map: DiffMap = new Map()
        for (const v of variants) {
          const b = byId.get(baseId(String(v._id)))
          if (b) map.set(baseId(String(v._id)), {differs: !deepEqual(b, v)})
        }
        maps.set(key, map)
      })
      .catch(() => maps.set(key, new Map()))
      .finally(() => {
        loading.delete(key)
        emit()
      })
  }, [client, key, type, variantId])
  return useSyncExternalStore(subscribe, () => (key ? (maps.get(key) ?? null) : null))
}

export function refreshDiffMaps() {
  maps.clear()
  emit()
}

// ---- The review pass (reviewPass C) --------------------------------------------------------------------------------------

export interface Pass {
  active: boolean
  type: string
  variantId: string
  /** The ids of the documents that differ, in list order. */
  ids: string[]
  index: number
}

const IDLE: Pass = {active: false, type: '', variantId: '', ids: [], index: 0}
let pass: Pass = IDLE
const looked = new Set<string>()
let lookedSnapshot: ReadonlySet<string> = new Set()

export const usePass = () => useSyncExternalStore(subscribe, () => pass)
export const useLooked = () => useSyncExternalStore(subscribe, () => lookedSnapshot)

function set(next: Pass) {
  pass = next
  if (next.active && next.ids[next.index]) {
    looked.add(next.ids[next.index])
    lookedSnapshot = new Set(looked)
  }
  emit()
}
export const startPass = (type: string, variantId: string, ids: string[]) =>
  set(ids.length ? {active: true, type, variantId, ids, index: 0} : IDLE)
export const nextInPass = () =>
  set(pass.active ? {...pass, index: (pass.index + 1) % pass.ids.length} : pass)
export const endPass = () => set(IDLE)
/** "Looked at" is reader state for this session only (open question 8). */
export function clearLooked() {
  looked.clear()
  lookedSnapshot = new Set()
  emit()
}
