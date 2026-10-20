import {FilterIcon} from '@sanity/icons/Filter'
// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook-variants-2-0,
// branch explorations/variants-2-0, commit 0c9f1e058e, lib/explorations/comparison-surfaces/axisIcons.ts).
// Changes: the Lucide flask for `experiment` (a Storybook-only dependency, with `matchSanityMetrics`) is replaced by
// `RocketIcon`, which is what the studio's own c1/dimensionIcons.tsx uses for the same key. The long design commentary is
// dropped; the lookup order is unchanged: the shipped map first, a local addition only fills a gap.
import {RocketIcon} from '@sanity/icons/Rocket'
import {type ComponentType} from 'react'

import {getVariantConditionIcon} from '../../../../packages/sanity/src/core/variants/tool/detail/variantConditionIcons'

const LOCAL_ADDITIONS: Record<string, ComponentType> = {
  experiment: RocketIcon,
  experimentation: RocketIcon,
}

/**
 * The glyph for a condition key. The shipped map is asked FIRST, and a local addition can only fill a gap, so a key Studio
 * covers keeps the glyph Studio gives it.
 */
export function axisIcon(key: string): ComponentType {
  const shipped = getVariantConditionIcon(key)
  if (shipped !== FilterIcon) return shipped

  const normalized = key.trim().toLowerCase()
  return LOCAL_ADDITIONS[normalized] ?? LOCAL_ADDITIONS[normalized.replace(/s$/, '')] ?? FilterIcon
}
