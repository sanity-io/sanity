/**
 * The external targeting "lay of the land" — the dimension space a customer's CDP,
 * experimentation, or feature-flag platform (plus the deterministic locale table)
 * already defines.
 *
 * FH-116 conceptual prototype. Hypothesis: editors (and Sanity-side agents) author
 * correct, well-distinguished variants by FILTERING and SELECTING against a visible
 * map of what these upstream systems contain — not by inventing condition keys from
 * scratch. Sanity's shipped autocomplete only sees keys/values already authored in
 * this dataset (a closed loop); this map opens that loop to the upstream sources so
 * the editor sees the whole space and Sanity + the CDP "speak the same truth".
 *
 * The map is a stub today (`getStubVariantDimensionMap`); a real sync from the
 * CDP / flag platform replaces the source without changing this shape or the
 * `system.variant` data model.
 *
 * @internal
 */
export type DimensionProvenance =
  | 'variant' // already authored in this dataset (the closed-loop source that shipped)
  | 'locale' // deterministic locale/market table
  | 'cdp-audience' // computed audience from a CDP (e.g. Segment)
  | 'feature-flag' // feature-flag variation (e.g. LaunchDarkly)
  | 'experiment' // experiment variation (e.g. Amplitude, GrowthBook)

/**
 * One dimension the upstream targeting stack exposes: a condition key plus the
 * values it can take, tagged with where it came from.
 *
 * @internal
 */
export interface ExternalDimension {
  key: string
  values: string[]
  provenance: DimensionProvenance
  /** Human label for the origin, shown to the editor, e.g. "Amplitude", "Segment". */
  source: string
}

/**
 * @internal
 */
export type VariantDimensionMap = ExternalDimension[]

/** Provenance/source shown for keys and values known only from already-authored variants. */
export const AUTHORED_VARIANT_PROVENANCE: DimensionProvenance = 'variant'
export const AUTHORED_VARIANT_SOURCE = 'Existing variants'

/**
 * Stub map standing in for a real CDP / experimentation / flag / locale sync. The
 * shape mirrors the runtime archetypes surfaced in customer research: a deterministic
 * locale table, an Amplitude experiment (control/treatment), Segment computed
 * audiences, and a LaunchDarkly feature flag. Replace with a synced source; nothing
 * downstream depends on the values being hard-coded.
 *
 * @internal
 */
export function getStubVariantDimensionMap(): VariantDimensionMap {
  return [
    {
      key: 'locale',
      provenance: 'locale',
      source: 'Locale table',
      values: ['en-US', 'en-GB', 'fr', 'de', 'nb-NO'],
    },
    {
      key: 'experiment',
      provenance: 'experiment',
      source: 'Amplitude',
      values: ['control', 'treatment'],
    },
    {
      key: 'audience',
      provenance: 'cdp-audience',
      source: 'Segment',
      values: ['high_spender', 'loyal', 'first_time', 'vip'],
    },
    {
      key: 'feature',
      provenance: 'feature-flag',
      source: 'LaunchDarkly',
      values: ['new_header_enabled', 'legacy_header'],
    },
  ]
}
