// The mapping between the studio's address model and the composed bar's values. Pure: no React, no studio imports.
// Checked by journeys/verify-composed-model.mts (node journeys/verify-composed-model.mts).
//
// The studio's address (compare/address.ts, c1/model.ts) is one `perspective` (`published`, `drafts` or a release id) and one
// variant (a short id such as `aud-members`, or `none`). The bar's address (composedAddress.tsx `ComposedValues`) is a value
// list per condition key, with the bundle as one more key (D10: Draft, Published or a release is ONE axis value, not two axes).
//
//   studio                                        bar
//   perspective drafts, variant aud-members   ->  {bundle: ['Draft'], audience: ['members']}
//   + against published, variant aud-members  ->  {bundle: ['Draft', 'Published'], audience: ['members']}

/** Same shape as `ComposedValues` in composedAddress.tsx, restated so this file imports nothing. */
export type BarValues = Record<string, string[]>

/** The bar's structural key. A bundle is exactly one of Draft, Published or a release. */
export const BUNDLE_KEY = 'bundle'

/** The studio's address of one side: a bundle id and one value per condition key. */
export interface Side {
  /** `published`, `drafts` or a release id. */
  bundle: string
  /** A value per condition key, for example `{audience: 'members', market: 'dach'}`. */
  values: Record<string, string>
}

/** A bundle the bar can offer: its id, and the label the bar shows and stores as the axis value. */
export interface BundleOption {
  /** `published`, `drafts` or a release id (the release name without `_.releases.`). */
  id: string
  label: string
}

/** The definitions the mapping needs: a short or full id, and what the definition conditions on. */
export interface VariantDefinition {
  _id: string
  conditions: Record<string, string>
}

export const NONE = 'none'

const VARIANT_PREFIX = '_.variants.'

/** `_.variants.aud-members` to `aud-members`. A short id passes through. */
export const shortVariantId = (id: string) =>
  id.startsWith(VARIANT_PREFIX) ? id.slice(VARIANT_PREFIX.length) : id

/** Draft and Published first, then the releases, whatever order the caller passed. */
export const DEFAULT_BUNDLES: BundleOption[] = [
  {id: 'drafts', label: 'Draft'},
  {id: 'published', label: 'Published'},
]

/** The label the bar stores for a bundle id. An id with no option is its own label. */
export function bundleLabel(bundles: readonly BundleOption[], id: string): string {
  return bundles.find((bundle) => bundle.id === id)?.label ?? id
}

/** The bundle id for a label the bar stored. A label with no option is its own id. */
export function bundleId(bundles: readonly BundleOption[], label: string): string {
  return bundles.find((bundle) => bundle.label === label)?.id ?? label
}

/** The condition values of a studio variant id (`aud-members` gives `{audience: 'members'}`). `none` and unknown ids give `{}`. */
export function valuesForVariant(
  variant: string,
  variants: readonly VariantDefinition[],
): Record<string, string> {
  if (!variant || variant === NONE) return {}
  const short = shortVariantId(variant)
  return {...variants.find((def) => shortVariantId(def._id) === short)?.conditions}
}

/**
 * The studio variant a set of condition values stands for: `none` for no values, the short id of the definition whose
 * conditions are exactly these values, or `null` when no single definition matches. `null` is a composite: the target model
 * allows an address no document sits behind (the composed reference deliberately does not resolve).
 */
export function variantForValues(
  values: Record<string, string>,
  variants: readonly VariantDefinition[],
): string | null {
  const entries = Object.entries(values)
  if (entries.length === 0) return NONE
  const match = variants.find((def) => {
    const conditions = Object.entries(def.conditions)
    return (
      conditions.length === entries.length &&
      conditions.every(([key, value]) => values[key] === value)
    )
  })
  return match ? shortVariantId(match._id) : null
}

/** The studio's `{perspective, variant}` as a side. A variant the definitions do not know contributes no values. */
export function sideOfAddress(
  address: {perspective: string; variant: string},
  variants: readonly VariantDefinition[],
): Side {
  return {bundle: address.perspective, values: valuesForVariant(address.variant, variants)}
}

/** A side as the studio's `{perspective, variant}`. `variant` is `null` for a composite (see `variantForValues`). */
export function addressOfSide(
  side: Side,
  variants: readonly VariantDefinition[],
): {perspective: string; variant: string | null} {
  return {perspective: side.bundle, variant: variantForValues(side.values, variants)}
}

/**
 * Whether the two sides can be drawn as one bar. The bar holds one value list per key, shared by both sides unless the key
 * is compared, so a key set on only one side has no place to sit.
 */
export function representable(anchor: Side, counterpart?: Side): boolean {
  if (!counterpart) return true
  const keys = new Set([...Object.keys(anchor.values), ...Object.keys(counterpart.values)])
  return [...keys].every((key) => key in anchor.values === key in counterpart.values)
}

const pair = (a: string, c: string | undefined): string[] =>
  c === undefined || c === a ? [a] : [a, c]

/**
 * The studio's side or sides as the bar's values. The bundle is the key `bundle`, valued by label. A key whose two sides
 * differ holds `[anchor, counterpart]`; a key they share holds `[value]`. A key present on one side only is dropped (see
 * `representable`). With no counterpart every key holds one value.
 */
export function toBar(
  anchor: Side,
  counterpart?: Side,
  bundles: readonly BundleOption[] = DEFAULT_BUNDLES,
): BarValues {
  const out: BarValues = {}
  out[BUNDLE_KEY] = pair(
    bundleLabel(bundles, anchor.bundle),
    counterpart && bundleLabel(bundles, counterpart.bundle),
  )
  for (const [key, value] of Object.entries(anchor.values)) {
    if (counterpart && !(key in counterpart.values)) continue
    out[key] = pair(value, counterpart?.values[key])
  }
  return out
}

/**
 * The bar's values as the studio's anchor side and, when any key is compared, the counterpart side. The anchor takes every
 * first value and the counterpart every second one, with a shared key's single value on both. A key holding no value is
 * dropped. A bar with no bundle value reads as the first bundle of `bundles`.
 */
export function fromBar(
  values: BarValues,
  bundles: readonly BundleOption[] = DEFAULT_BUNDLES,
): {anchor: Side; counterpart?: Side} {
  const side = (index: 0 | 1): Side => {
    const pick = (list: string[] | undefined) => list?.[index] ?? list?.[0]
    const bundleValue = pick(values[BUNDLE_KEY])
    const sideValues: Record<string, string> = {}
    for (const [key, list] of Object.entries(values)) {
      if (key === BUNDLE_KEY) continue
      const value = pick(list)
      if (value !== undefined) sideValues[key] = value
    }
    return {
      bundle:
        bundleValue === undefined ? (bundles[0]?.id ?? 'drafts') : bundleId(bundles, bundleValue),
      values: sideValues,
    }
  }
  const comparing = Object.values(values).some((list) => list.length === 2)
  return comparing ? {anchor: side(0), counterpart: side(1)} : {anchor: side(0)}
}

/** The keys that currently hold two values (the compared dimensions, the bundle included). */
export function comparedKeys(values: BarValues): string[] {
  return Object.entries(values)
    .filter(([, list]) => list.length === 2)
    .map(([key]) => key)
}
