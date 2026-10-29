import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {RocketIcon} from '@sanity/icons/Rocket'
import {StarIcon} from '@sanity/icons/Star'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {TranslateIcon} from '@sanity/icons/Translate'
import {type ComponentType, type CSSProperties, type SVGProps} from 'react'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 2700f4cf07, lib/explorations/variants-2-0/perspective/dimensionIcons.tsx).
// Changes: imports point at this monorepo and ./model; LIVE: marks the few places that read live data.
import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../packages/sanity/src/core/components/temporary-icons/RhombusOutlined'

/**
 * The variant diamond at the size of the other dimension icons: the bare RhombusIcon draws the diamond in the middle third of a
 * 25-unit box, so the viewBox crops to it (the Handoff Studio's size). Audience, unknown dimensions and the "View all" row use it.
 */
export function VariantDiamond(props: SVGProps<SVGSVGElement>) {
  return <RhombusIcon viewBox="3.5 3.5 18 18" {...props} />
}

/**
 * One icon per dimension. Stand-ins from the icon set until the real axis icons exist: Audience
 * the variant diamond (the users glyph clashed with the user avatar), Campaign (the fixtures call it Experiment) rocket, Channel th-large, Locale (Language)
 * translate, Market earth-globe, Plan star.
 */
const ICONS: Record<string, ComponentType<{style?: CSSProperties}>> = {
  audience: VariantDiamond,
  experiment: RocketIcon,
  campaign: RocketIcon,
  channel: ThLargeIcon,
  language: TranslateIcon,
  locale: TranslateIcon,
  market: EarthGlobeIcon,
  plan: StarIcon,
}

/** The variant purple (the suggest tone's icon colour, as Studio's own variant menus carry it). */
const PURPLE = {'--card-icon-color': 'var(--card-badge-suggest-icon-color)'} as CSSProperties

/**
 * The empty diamond: a variant that is defined but has no version of this document yet (27 Oct call, Pedro and Andrej; Studio Patterns
 * PerspectiveMenu.Variant). The same size and purple as the filled one, so the two read as one family. From the Handoff Studio (61622dfef4).
 */
export function VariantDiamondOutline(props: {style?: CSSProperties}) {
  return (
    <RhombusOutlinedIcon viewBox="3.5 3.5 18 18" {...props} style={{...PURPLE, ...props.style}} />
  )
}

/**
 * A dimension's icon. It is purple, except on a selected row, where it takes the row's own
 * foreground (`selected`): purple and muted grey wash out on the selected fill.
 */
export function DimensionIcon(props: {name: string; selected?: boolean; style?: CSSProperties}) {
  const Icon = ICONS[props.name] ?? VariantDiamond
  return <Icon style={{...(props.selected ? undefined : PURPLE), ...props.style}} />
}
