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
