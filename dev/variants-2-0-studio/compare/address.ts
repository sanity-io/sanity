// Addresses and comparisons, read from and written to the structure URL (the panes segment). One pane per group; a comparison is the same
// document twice in a row, the second pane carrying a local perspective (`localPerspective`, `localVariant`: core DocumentPerspectiveProvider).
// Pure: no React. Checked by journeys/verify-compare-model.mts.

export interface Address {
  /** `published`, `drafts` or a release id. */
  perspective: string
  /** A variant id (short, `aud-members`) or `none` for the base. */
  variant: string
}

export const NONE = 'none'

export interface Comparison {
  docId: string
  docType: string
  showing: Address
  against: Address
  /** The index of the Against group in the panes. */
  againstIndex: number
  groups: string[]
}

export const sameAddress = (a: Address, b: Address) =>
  a.perspective === b.perspective && a.variant === b.variant

/** One-move options: the other address may differ from Showing in ONE coordinate (the layer, or the variant), never both (R2). */
export const isOneMove = (showing: Address, candidate: Address) =>
  showing.perspective === candidate.perspective || showing.variant === candidate.variant

const PREFIX = '/structure/'

/** The decoded groups of a structure path (`['e9Case', 'e9-visitors', 'e9-visitors,localVariant=aud-members']`), or null. */
export function groupsOf(pathname: string): string[] | null {
  const at = pathname.indexOf(PREFIX)
  if (at < 0) return null
  const segment = pathname.slice(at + PREFIX.length).split('/')[0]
  if (!segment) return null
  return decodeURIComponent(segment).split(';').filter(Boolean)
}

export function pathOf(groups: string[]): string {
  return `${PREFIX}${groups.map(encodeURIComponent).join(';')}`
}

function paramsOf(group: string): {id: string; params: Record<string, string>} {
  const [first, ...rest] = group.split('|')[0].split(',')
  const params: Record<string, string> = {}
  for (const part of rest) {
    const eq = part.indexOf('=')
    if (eq > 0) params[part.slice(0, eq)] = part.slice(eq + 1)
  }
  return {id: first, params}
}

export function addressOfGroup(group: string, global: Address): Address {
  const {params} = paramsOf(group)
  if (!params.localPerspective && !params.localVariant) return global
  return {perspective: params.localPerspective ?? 'drafts', variant: params.localVariant ?? NONE}
}

export function groupFor(docId: string, address: Address): string {
  return `${docId},localPerspective=${address.perspective},localVariant=${address.variant}`
}

export function readComparison(pathname: string, global: Address): Comparison | null {
  const groups = groupsOf(pathname)
  if (!groups || groups.length < 3) return null
  const last = paramsOf(groups[groups.length - 1])
  const before = paramsOf(groups[groups.length - 2])
  if (last.id !== before.id) return null
  if (!last.params.localPerspective && !last.params.localVariant) return null
  return {
    docId: last.id,
    docType: groups[0].split(',')[0],
    showing: addressOfGroup(groups[groups.length - 2], global),
    against: addressOfGroup(groups[groups.length - 1], global),
    againstIndex: groups.length - 1,
    groups,
  }
}

/** The path that opens `docId` beside the current document at `address`. An earlier Against pane is replaced (one comparison at a time). */
export function openBesidePath(
  pathname: string,
  docId: string,
  address: Address,
  global: Address,
): string | null {
  const groups = groupsOf(pathname)
  if (!groups || groups.length < 2) return null
  const existing = readComparison(pathname, global)
  const base = existing ? groups.slice(0, -1) : groups
  return pathOf([...base, groupFor(docId, address)])
}

export const closePath = (pathname: string, global: Address): string | null => {
  const comparison = readComparison(pathname, global)
  return comparison ? pathOf(comparison.groups.slice(0, -1)) : null
}

/** Sets the Against pane's address. */
export function setAgainstPath(comparison: Comparison, address: Address): string {
  const groups = [...comparison.groups]
  groups[comparison.againstIndex] = groupFor(comparison.docId, address)
  return pathOf(groups)
}

export type CompareKind = 'variants' | 'translations' | 'layer' | 'same' | 'refused'

/** D12: the title names what differs. Two dimensions at once are refused in the open beta (C6). */
export function compareKind(
  showing: Address,
  against: Address,
  isLocale: (variant: string) => boolean,
): CompareKind {
  const layer = showing.perspective !== against.perspective
  const variant = showing.variant !== against.variant
  if (layer && variant) return 'refused'
  if (variant)
    return isLocale(showing.variant) || isLocale(against.variant) ? 'translations' : 'variants'
  if (layer) return 'layer'
  return 'same'
}

export const layerWord = (perspective: string, titleOfRelease?: (id: string) => string) =>
  perspective === 'published'
    ? 'Published'
    : perspective === 'drafts'
      ? 'Drafts'
      : (titleOfRelease?.(perspective) ?? perspective)

export function compareTitle(kind: CompareKind, showing: Address, against: Address): string {
  if (kind === 'variants') return 'Comparing variants'
  if (kind === 'translations') return 'Comparing translations'
  if (kind === 'layer')
    return against.perspective === 'published'
      ? 'Seeing what changed since Published'
      : `Comparing ${layerWord(showing.perspective)} and ${layerWord(against.perspective)}`
  if (kind === 'refused') return 'These two addresses differ in two ways'
  return 'Both panes show the same address'
}
