// The variant ranking rule, as Content Lake runs it today: ADR-3 in sanity-io/gradient, pkg/documents/variant/resolver.go (`Resolve`),
// read on origin/main on 10 Nov 2026. One copy for every lens and for the inventory, so no surface ranks on its own idea.
//
//   1. A definition is a candidate only if ALL its conditions equal the visitor's values. Extra visitor values are fine. A definition
//      with no conditions never matches.
//   2. Rank: more matched conditions first, then higher priority, then earlier _createdAt, then _id (the name).
//   3. Per document, fall through the ranked list to the first definition that HAS a version of that document, then to the base.
//
// "Specificity" counts conditions (one value per key). There is no dimension order anywhere in the fallback.
// The resolver keeps only the top MAX_RESOLVED definitions (open question with engineering; mirrored here, not decided).
import {type SystemVariant} from './model'

export const MAX_RESOLVED = 10

export type Ranked = Pick<SystemVariant, '_id' | 'conditions' | 'priority'> & {_createdAt?: string}

/** The short id (the `_id` suffix): what the resolver orders on last. */
const nameOf = (v: Pick<SystemVariant, '_id'>) => v._id.replace(/^_\.variants\./, '')

/** True when `definition` is a non-empty subset of the visitor's values, byte for byte. */
export function matchesVisitor(
  conditions: Record<string, string> | undefined,
  visitor: Record<string, string | undefined>,
): boolean {
  const entries = Object.entries(conditions ?? {})
  return entries.length > 0 && entries.every(([key, value]) => visitor[key] === value)
}

/** True when `x` ranks strictly above `y`. */
function preferred(x: Ranked, y: Ranked): number {
  const xc = Object.keys(x.conditions ?? {}).length
  const yc = Object.keys(y.conditions ?? {}).length
  if (xc !== yc) return yc - xc
  if ((x.priority ?? 0) !== (y.priority ?? 0)) return (y.priority ?? 0) - (x.priority ?? 0)
  const xt = x._createdAt ?? ''
  const yt = y._createdAt ?? ''
  if (xt !== yt) return xt < yt ? -1 : 1
  const xn = nameOf(x)
  const yn = nameOf(y)
  return xn < yn ? -1 : xn > yn ? 1 : 0
}

/** The definitions that match the visitor, best first, at most MAX_RESOLVED. Empty when none match. */
export function rankDefinitions<T extends Ranked>(
  visitor: Record<string, string | undefined>,
  definitions: T[],
): T[] {
  return definitions
    .filter((v) => matchesVisitor(v.conditions, visitor))
    .sort(preferred)
    .slice(0, MAX_RESOLVED)
}

/**
 * Per document: the first ranked definition that has a version of it. `has` says whether a definition has one. Null means the base
 * document is served (no ranked definition has a version).
 */
export function firstWithVersion<T extends Ranked>(
  ranked: T[],
  has: (definition: T) => boolean,
): T | null {
  return ranked.find(has) ?? null
}

/** A stored version, as far as serving cares: which definition (null = the base document) and where it sits. */
export interface ServedVersion {
  variantId: string | null
  /** `published`, `drafts` or a release name. */
  bundle: string
}

export interface Served {
  /** The definition served (its short id), or null for the base document. */
  variantId: string | null
  /** Where the served version sits: `published` or the release it is read from. */
  bundle: string
  /** Why: the version won as the base, as a variant in Published, in the release, or nothing at all (no version is published). */
  via:
    | 'variant-in-release'
    | 'variant-in-published'
    | 'base-in-release'
    | 'base-in-published'
    | 'none'
  /** The top-ranked definition has no version that can be served, and a lower-ranked one was served instead. */
  fellThrough: boolean
  /**
   * Open question (1) with engineering: in a release preview, a higher-ranked definition's Published version beat a
   * lower-ranked definition's version in the release. Built as the ADR text reads; shown as pending.
   */
  pending: boolean
}

const shortName = (v: Ranked) => nameOf(v)

/**
 * What a visitor is served for ONE document, as the ADR reads. `perspective` is `published`, `drafts` or a release name.
 * Drafts are never served, so `drafts` reads as `published`; a release bar reads as if the release had gone out.
 * Per definition in rank order: its version in the release, then its version in Published. Only then the release's base version,
 * then Published's base. A variant beats a release ("variant beats release").
 */
export function serveDocument(
  ranked: Ranked[],
  versions: ServedVersion[],
  perspective: string,
): Served {
  const release = perspective === 'published' || perspective === 'drafts' ? null : perspective
  const has = (variantId: string | null, bundle: string) =>
    versions.some((v) => v.variantId === variantId && v.bundle === bundle)
  const top = ranked[0] ? shortName(ranked[0]) : null
  for (const definition of ranked) {
    const id = shortName(definition)
    const fellThrough = top !== null && id !== top
    if (release && has(id, release)) {
      return {
        variantId: id,
        bundle: release,
        via: 'variant-in-release',
        fellThrough,
        pending: false,
      }
    }
    if (has(id, 'published')) {
      // Contested: a lower-ranked definition holds a version in the release that this Published one beat.
      const pending =
        release !== null &&
        ranked.slice(ranked.indexOf(definition) + 1).some((lower) => has(shortName(lower), release))
      return {variantId: id, bundle: 'published', via: 'variant-in-published', fellThrough, pending}
    }
  }
  const fellThrough = false
  if (release && has(null, release)) {
    return {variantId: null, bundle: release, via: 'base-in-release', fellThrough, pending: false}
  }
  if (has(null, 'published')) {
    return {
      variantId: null,
      bundle: 'published',
      via: 'base-in-published',
      fellThrough,
      pending: false,
    }
  }
  return {variantId: null, bundle: 'published', via: 'none', fellThrough, pending: false}
}
