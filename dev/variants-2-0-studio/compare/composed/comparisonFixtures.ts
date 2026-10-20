// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook-variants-2-0,
// branch explorations/variants-2-0, commit 0c9f1e058e, lib/explorations/comparison-surfaces/comparisonFixtures.ts).
// Changes: SLIMMED. Only `RESOLUTION_LIMITS` and `candidateLayerCount` are kept verbatim (the bar's ceiling uses them).
// The 826-line fixture world (`richVariants` and its article/scenario tables) is replaced by `fallbackVariants`, a
// handful of single-condition definitions used only when a caller passes no `variants`. The studio drives the bar from
// the dataset's real `system.variant` definitions through props.
import {
  VARIANT_DOCUMENT_TYPE,
  VARIANT_DOCUMENTS_PATH,
} from '../../../../packages/sanity/src/core/variants/store/constants'
import {
  type SystemVariant,
  type VariantId,
} from '../../../../packages/sanity/src/core/variants/types'

/**
 * The ceiling on how much resolution work an address may ask for. Adding one definition to an address
 * roughly DOUBLES it, because n definitions produce 2ⁿ−1 layers.
 */
export const RESOLUTION_LIMITS = {
  /** How many variant definitions may exist in the workspace. */
  definitions: 200,
  /** How many conditions one definition may carry. Caps compounding upstream. */
  conditionsPerDefinition: 8,
  /** How many conditions one query may specify. Caps the address itself. */
  conditionsPerQuery: 6,
  /** Candidate layers resolution will walk. The real ceiling. */
  totalPermutations: 63,
} as const

/** Candidate layers a composed address of `n` definitions makes resolution walk: 2ⁿ−1. */
export function candidateLayerCount(definitionCount: number): number {
  return 2 ** definitionCount - 1
}

const FALLBACK_SPECS: {key: string; value: string; title: string}[] = [
  {key: 'audience', value: 'new-visitors', title: 'New Visitors'},
  {key: 'audience', value: 'returning-customers', title: 'Returning Customers'},
  {key: 'audience', value: 'members', title: 'Members'},
  {key: 'market', value: 'dach', title: 'DACH'},
  {key: 'market', value: 'nordics', title: 'Nordics'},
  {key: 'market', value: 'uki', title: 'UK & Ireland'},
  {key: 'locale', value: 'en-US', title: 'English (US)'},
  {key: 'locale', value: 'de-DE', title: 'German (Germany)'},
  {key: 'locale', value: 'fr-FR', title: 'French (France)'},
  {key: 'channel', value: 'web', title: 'Web'},
  {key: 'channel', value: 'email', title: 'Email'},
]

/** A few single-condition definitions, so the bar renders when no `variants` are passed. Never read from the dataset. */
export const fallbackVariants: SystemVariant[] = FALLBACK_SPECS.map((spec) => {
  const slug = `${spec.key}-${spec.value.toLowerCase()}`
  return {
    _id: `${VARIANT_DOCUMENTS_PATH}.${slug}` as VariantId,
    _type: VARIANT_DOCUMENT_TYPE,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _rev: `rev-${slug}`,
    conditions: {[spec.key]: spec.value},
    priority: 0,
    metadata: {title: spec.title},
  }
})
