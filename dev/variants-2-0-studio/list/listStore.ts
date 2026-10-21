import {useEffect, useMemo, useSyncExternalStore} from 'react'
import {useClient} from 'sanity'

import {type Address, NONE} from '../compare/address'
import {useReviewBase} from '../compare/reviewBase'
import {useGlobalAddress} from '../compare/useCompare'
import {deepEqual, type Json} from '../fieldmarks/markModel'

// Data for the E9 list work: which documents of a list differ from their base for one variant ("Returning visitors against Base"),
// and the review pass held in the list pane (reviewPass C). Module stores, so the rows, the header and the pane agree.

// ---- Which documents differ from the base ----------------------------------------------------------------------------

export type DiffMap = Map<string, {differs: boolean}>

const maps = new Map<string, DiffMap>()
/** The most recent map per type and variant, whatever the base was, for the list order (changed documents first). */
const latest = new Map<string, DiffMap>()
const counter = {version: 0}
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

type RawDoc = Record<string, Json>

const refOf = (d: RawDoc): string | null =>
  (d._system as {variant?: {_ref?: string}; bundleId?: string} | undefined)?.variant?._ref ?? null

/** Which bundle a raw version sits in: `published`, `drafts` or a release id. The system field says it for variants; a base document says it by its id. */
function bundleOf(d: RawDoc): string {
  const system = d._system as {bundleId?: string; variant?: unknown} | undefined
  if (system?.bundleId) return system.bundleId
  // A variant without a bundle id is the published one (its id carries a scope id, not the bundle).
  if (system?.variant) return 'published'
  const id = String(d._id)
  if (id.startsWith('drafts.')) return 'drafts'
  return /^versions\.([^.]+)\./.exec(id)?.[1] ?? 'published'
}

/** What a reader would compare: the content, without the system fields (`_id`, `_rev`, `_system`, times). */
const content = (d: RawDoc): RawDoc =>
  Object.fromEntries(Object.entries(d).filter(([key]) => !key.startsWith('_') || key === '_type'))

/** The version of one document at an address, from every raw version of the type. A drafts address falls back to the published version. */
function docAt(versions: readonly RawDoc[], id: string, address: Address): RawDoc | null {
  const variant = address.variant === NONE ? null : `_.variants.${address.variant}`
  const ofVariant = versions.filter((d) => refOf(d) === variant && baseId(String(d._id)) === id)
  const inBundle = (bundle: string) => ofVariant.find((d) => bundleOf(d) === bundle) ?? null
  if (address.perspective === 'drafts') return inBundle('drafts') ?? inBundle('published')
  return inBundle(address.perspective)
}

/**
 * For every document of `type` with a version at the variant: does the document at the SHOWING address (the global perspective, this variant)
 * differ from its version at the BASE (compare/reviewBase: the published version unless the user picked another address)? Raw, API version X.
 * The map is keyed by showing, base and type, so a new base recounts.
 */
export function useDiffMap(type: string | undefined, variantId: string | null): DiffMap | null {
  const base = useClient({apiVersion: 'X'})
  const client = useMemo(
    () => base.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
    [base],
  )
  const global = useGlobalAddress()
  const showing: Address = {perspective: global.perspective, variant: variantId ?? NONE}
  const {base: against} = useReviewBase(showing)
  const showingPerspective = showing.perspective
  const basePerspective = against.perspective
  const baseVariant = against.variant
  const key =
    type && variantId
      ? `${type}|${showingPerspective}|${variantId}|${basePerspective}|${baseVariant}`
      : ''
  useEffect(() => {
    if (!key || !type || !variantId || loading.has(key)) return
    loading.add(key)
    void (client.fetch('*[_type == $type]', {type}) as Promise<RawDoc[]>)
      .then((all) => {
        const map: DiffMap = new Map()
        const ids = new Set(
          all
            .filter((d) => refOf(d) === `_.variants.${variantId}`)
            .map((d) => baseId(String(d._id))),
        )
        const here$ = {perspective: showingPerspective, variant: variantId}
        const there$ = {perspective: basePerspective, variant: baseVariant}
        for (const id of ids) {
          const here = docAt(all, id, here$)
          const there = docAt(all, id, there$)
          // No version at the base means nothing to differ from; a missing showing version is not part of the pass.
          if (here && there) map.set(id, {differs: !deepEqual(content(there), content(here))})
        }
        maps.set(key, map)
        latest.set(`${type}|${variantId}`, map)
        counter.version++
      })
      .catch(() => maps.set(key, new Map()))
      .finally(() => {
        loading.delete(key)
        emit()
      })
  }, [client, key, type, variantId, showingPerspective, basePerspective, baseVariant])
  return useSyncExternalStore(subscribe, () => (key ? (maps.get(key) ?? null) : null))
}

// ---- Review sets (reviewSet B: a release against the base; C: changed since) ------------------------------------------------

export interface SetCounts {
  /** Documents in the set. */
  total: number
  /** Documents whose version differs from the base. */
  differs: number
  /** Documents with no version at the base. */
  isNew: number
}
const setCounts = new Map<string, SetCounts>()
const setLoading = new Set<string>()
const emptySet: SetCounts = {total: 0, differs: 0, isNew: 0}

function useRaw() {
  const base = useClient({apiVersion: 'X'})
  return useMemo(
    () => base.withConfig({apiVersion: 'X', perspective: 'raw', useCdn: false}),
    [base],
  )
}

/** M3: the documents of one release against the base address. `null` while counting. */
export function useReleaseSet(
  type: string | undefined,
  release: string | null,
  against: Address,
): SetCounts | null {
  const client = useRaw()
  const basePerspective = against.perspective
  const key = type && release ? `release|${type}|${release}|${basePerspective}` : ''
  useEffect(() => {
    if (!key || !type || !release || setLoading.has(key)) return
    setLoading.add(key)
    void (client.fetch('*[_type == $type]', {type}) as Promise<RawDoc[]>)
      .then((all) => {
        const ids = new Set(
          all
            .filter((d) => String(d._id).startsWith(`versions.${release}.`))
            .map((d) => baseId(String(d._id))),
        )
        const counts = {total: ids.size, differs: 0, isNew: 0}
        for (const id of ids) {
          const here = docAt(all, id, {perspective: release, variant: NONE})
          const there = docAt(all, id, {perspective: basePerspective, variant: NONE})
          if (!there) counts.isNew++
          else if (here && !deepEqual(content(there), content(here))) counts.differs++
        }
        setCounts.set(key, counts)
      })
      .catch(() => setCounts.set(key, emptySet))
      .finally(() => {
        setLoading.delete(key)
        emit()
      })
  }, [client, key, type, release, basePerspective])
  return useSyncExternalStore(subscribe, () => (key ? (setCounts.get(key) ?? null) : null))
}

/** M4: the documents of a type edited in the last `days` days (any version), counted at document level. */
export function useChangedSince(type: string | undefined, days: number): number | null {
  const client = useRaw()
  const day = new Date().toISOString().slice(0, 10)
  const key = type ? `since|${type}|${days}|${day}` : ''
  useEffect(() => {
    if (!key || !type || setLoading.has(key)) return
    setLoading.add(key)
    const since = new Date(Date.now() - days * 86_400_000).toISOString()
    void (
      client.fetch('*[_type == $type && _updatedAt > $since]._id', {type, since}) as Promise<
        string[]
      >
    )
      .then((found) => {
        setCounts.set(key, {total: new Set(found.map(baseId)).size, differs: 0, isNew: 0})
      })
      .catch(() => setCounts.set(key, emptySet))
      .finally(() => {
        setLoading.delete(key)
        emit()
      })
  }, [client, key, type, days])
  return useSyncExternalStore(subscribe, () => (key ? (setCounts.get(key)?.total ?? null) : null))
}

/** Changes whenever a diff map arrives, so the list re-arranges itself. */
export const useDiffVersion = () => useSyncExternalStore(subscribe, () => counter.version)
export const peekDiffMap = (type: string, variantId: string): DiffMap | undefined =>
  latest.get(`${type}|${variantId}`)

export function refreshDiffMaps() {
  maps.clear()
  setCounts.clear()
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
