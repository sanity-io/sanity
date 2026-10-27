/** Where a version sits, as the sort reads it. A release carries its type, its intended publish time and whether it is scheduled (locked). */
export type VersionPlace =
  | 'published'
  | 'drafts'
  | {type?: 'asap' | 'scheduled' | 'undecided'; at?: string | null; locked?: boolean}

export interface VersionSortKey {
  /** Left out for a row that names no bundle (a Variants menu row is a variant, not a version in one place). */
  place?: VersionPlace
  /** The variant, or null for the base document. */
  variant: string | null
  /** This document has this version (a greyed row is one it has not). */
  has: boolean
  title: string
}

/** Published, Drafts, open releases (ASAP, then dated, then undecided), then scheduled (locked) releases. */
function placeRank(place: VersionPlace | undefined): number {
  if (place === undefined || place === 'published') return 0
  if (place === 'drafts') return 1
  if (place.locked) return 5
  if (place.type === 'asap') return 2
  if (place.type === 'scheduled') return 3
  return 4
}

const time = (place: VersionPlace | undefined) =>
  typeof place === 'object' && place.at ? Date.parse(place.at) : Number.POSITIVE_INFINITY

/**
 * C12 B, the version menus sorted (27 Oct, Faheem). The rule, in order: Published, then Drafts; then the open releases with the soonest
 * intended publish date first (ASAP before dated, undecided last); then the scheduled releases by date. In one place the base comes first
 * and its variants after it, not interleaved; then the versions this document has before the ones it has not; ties go by title, A to Z.
 * Pure: it returns a new array and leaves the input as it is.
 */
export function sortVersions<T>(items: readonly T[], keyOf: (item: T) => VersionSortKey): T[] {
  const keyed = items.map((item) => ({item, key: keyOf(item)}))
  keyed.sort(
    (x, y) =>
      placeRank(x.key.place) - placeRank(y.key.place) ||
      time(x.key.place) - time(y.key.place) ||
      Number(x.key.variant !== null) - Number(y.key.variant !== null) ||
      Number(y.key.has) - Number(x.key.has) ||
      x.key.title.localeCompare(y.key.title),
  )
  return keyed.map(({item}) => item)
}
