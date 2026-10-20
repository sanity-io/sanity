// The model behind the E9 field marks (F2-D: roll-up and arbitration). Pure functions, no React.
//  - `tally` counts the leaf changes between two values: added, removed, changed, moved.
//  - `claimOf` turns two tallies into the ONE mark a field shows: changed (against the published version at the same address)
//    wins over differs from base. A "diverged" claim (merge conflict, not shipped here) would sit between them; the slot is `diverged`.
//  - Array items are matched by `_key` (objects) or by value (primitives), so added, removed and moved are told apart from changed.

export type Json = unknown
export type Seg = string | number | {_key: string}

export interface Tally {
  added: number
  removed: number
  changed: number
  moved: number
}

export const ZERO: Tally = {added: 0, removed: 0, changed: 0, moved: 0}
export const sum = (t: Tally) => t.added + t.removed + t.changed + t.moved
const add = (a: Tally, b: Tally): Tally => ({
  added: a.added + b.added,
  removed: a.removed + b.removed,
  changed: a.changed + b.changed,
  moved: a.moved + b.moved,
})

const META = new Set(['_key', '_id', '_rev', '_createdAt', '_updatedAt', '_system', '_type'])
const isObj = (v: Json): v is Record<string, Json> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
const keyOf = (v: Json, i: number, seen: Map<string, number>): string => {
  if (isObj(v) && typeof v._key === 'string') return `k:${v._key}`
  const base = `v:${JSON.stringify(v)}`
  const n = seen.get(base) ?? 0
  seen.set(base, n + 1)
  return `${base}#${n}`
}

export function get(value: Json, path: readonly Seg[]): Json {
  let current: Json = value
  for (const segment of path) {
    if (current === null || current === undefined) return undefined
    if (typeof segment === 'object') {
      current = Array.isArray(current)
        ? current.find((i) => isObj(i) && i._key === segment._key)
        : undefined
    } else if (Array.isArray(current)) current = current[segment as number]
    else if (isObj(current)) current = current[segment as string]
    else return undefined
  }
  return current
}

export function deepEqual(a: Json, b: Json): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
  if (isObj(a) && isObj(b)) {
    const keys = new Set(
      [...Object.keys(a), ...Object.keys(b)].filter((k) => !META.has(k) || k === '_type'),
    )
    for (const k of keys) if (k !== '_type' && !deepEqual(a[k], b[k])) return false
    return true
  }
  return false
}

interface Matched {
  /** For each item of `current`, the index of the same item in `compare`, or -1 when it is new. */
  fromCurrent: number[]
  removed: number[]
}

function match(compare: Json[], current: Json[]): Matched {
  const seenA = new Map<string, number>()
  const seenB = new Map<string, number>()
  const indexA = new Map<string, number>()
  compare.forEach((v, i) => indexA.set(keyOf(v, i, seenA), i))
  const used = new Set<number>()
  const fromCurrent = current.map((v, i) => {
    const at = indexA.get(keyOf(v, i, seenB))
    if (at === undefined) return -1
    used.add(at)
    return at
  })
  const removed = compare.map((_, i) => i).filter((i) => !used.has(i))
  return {fromCurrent, removed}
}

/** Which items of `current` are moved: the common items that are not in the longest run that kept their order. */
function movedSet(m: Matched): Set<number> {
  const common = m.fromCurrent.map((from, i) => ({from, i})).filter((e) => e.from >= 0)
  if (common.length < 2) return new Set()
  const keep = lisIndexes(common.map((e) => e.from))
  return new Set(common.filter((_, n) => !keep.has(n)).map((e) => e.i))
}

/** The positions (in the sequence) that belong to one longest increasing subsequence. */
function lisIndexes(values: number[]): Set<number> {
  const tails: number[] = []
  const tailIdx: number[] = []
  const prev: number[] = new Array(values.length).fill(-1)
  values.forEach((v, i) => {
    let lo = 0
    let hi = tails.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (tails[mid] < v) lo = mid + 1
      else hi = mid
    }
    tails[lo] = v
    tailIdx[lo] = i
    prev[i] = lo > 0 ? tailIdx[lo - 1] : -1
  })
  const out = new Set<number>()
  let at = tailIdx[tails.length - 1]
  while (at !== undefined && at >= 0) {
    out.add(at)
    at = prev[at]
  }
  return out
}

export function tally(compare: Json, current: Json): Tally {
  if (deepEqual(compare, current)) return ZERO
  if (compare === undefined || compare === null)
    return current === undefined || current === null ? ZERO : {...ZERO, added: 1}
  if (current === undefined || current === null) return {...ZERO, removed: 1}
  if (Array.isArray(compare) && Array.isArray(current)) {
    const m = match(compare, current)
    let total: Tally = {
      ...ZERO,
      removed: m.removed.length,
      added: m.fromCurrent.filter((f) => f < 0).length,
    }
    total.moved = movedSet(m).size
    m.fromCurrent.forEach((from, i) => {
      if (from >= 0) total = add(total, tally(compare[from], current[i]))
    })
    return total
  }
  if (isObj(compare) && isObj(current)) {
    let total = ZERO
    for (const k of new Set([...Object.keys(compare), ...Object.keys(current)])) {
      if (META.has(k)) continue
      total = add(total, tally(compare[k], current[k]))
    }
    return total
  }
  return {...ZERO, changed: 1}
}

export type ItemKind = 'added' | 'changed' | 'moved' | 'same'

/** What each item of `current` is against `compare` (by index of `current`), and the items that were removed. */
export function arrayKinds(compare: Json, current: Json): {kinds: ItemKind[]; removed: Json[]} {
  if (!Array.isArray(compare) || !Array.isArray(current)) return {kinds: [], removed: []}
  const m = match(compare, current)
  const moved = movedSet(m)
  const kinds = m.fromCurrent.map((from, i): ItemKind => {
    if (from < 0) return 'added'
    if (!deepEqual(compare[from], current[i])) return 'changed'
    return moved.has(i) ? 'moved' : 'same'
  })
  return {kinds, removed: m.removed.map((i) => compare[i])}
}

/** A short label for an item or value, for notes and the peek. */
export function describe(value: Json): string {
  if (value === undefined || value === null) return 'Empty'
  if (typeof value === 'string')
    return value.length > 90 ? `${value.slice(0, 90)}…` : value || 'Empty'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? 'item' : 'items'}`
  if (isObj(value)) {
    if (value._type === 'block' && Array.isArray(value.children))
      return describe((value.children as Json[]).map((c) => (isObj(c) ? c.text : '')).join(''))
    if (typeof value._ref === 'string') return `Reference to ${value._ref}`
    const titled = ['heading', 'title', 'name', 'label']
      .map((k) => value[k])
      .find((v) => typeof v === 'string')
    if (titled) return String(titled)
    const keys = Object.keys(value).filter((k) => !META.has(k))
    return `${keys.length} ${keys.length === 1 ? 'field' : 'fields'}`
  }
  return String(value)
}

export type ClaimKind = 'changed' | 'diverged' | 'differs'

export interface Claim {
  kind: ClaimKind
  /** Leaf changes behind the claim (a roll-up count for a container). */
  count: number
  tally: Tally
}

export interface Claims {
  /** The one claim the mark shows (the highest priority), or null. */
  top: Claim | null
  /** Every claim, highest priority first: the peek lists them all so none is lost (F2-AC5). */
  all: Claim[]
}

/** Arbitration: changed (against the published version at this address), then diverged (not shipped), then differs from base. */
export function claimsOf(
  published: Json,
  base: Json,
  current: Json,
  hasPublished: boolean,
  hasBase: boolean,
): Claims {
  const all: Claim[] = []
  if (hasPublished) {
    const t = tally(published, current)
    if (sum(t) > 0) all.push({kind: 'changed', count: sum(t), tally: t})
  }
  if (hasBase) {
    const t = tally(base, current)
    if (sum(t) > 0) all.push({kind: 'differs', count: sum(t), tally: t})
  }
  return {top: all[0] ?? null, all}
}

/** Keys of the document that the schema does not know (not `_` fields): the unknown-path marks (F2-AC6). */
export function unknownKeys(doc: Json, known: readonly string[]): string[] {
  if (!isObj(doc)) return []
  return Object.keys(doc).filter((k) => !k.startsWith('_') && !known.includes(k))
}
