import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {RocketIcon} from '@sanity/icons/Rocket'
import {StarIcon} from '@sanity/icons/Star'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {TranslateIcon} from '@sanity/icons/Translate'
import {type ComponentType, type CSSProperties} from 'react'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 2700f4cf07, lib/explorations/variants-2-0/perspective/dimensionIcons.tsx).
// Changes: imports point at this monorepo and ./model; LIVE: marks the few places that read live data.
import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'

/**
 * One icon per dimension. Stand-ins from the icon set until the real axis icons exist: Audience
 * the variant diamond (a people glyph read as the signed-in user's avatar, David 26 Oct), Campaign (the fixtures call it Experiment) rocket, Channel th-large, Locale (Language)
 * translate, Market earth-globe, Plan star.
 */
/**
 * The variant diamond at the size of the other dimension icons. The temporary Rhombus draws its diamond in the middle third of a
 * 25-unit box (sized for field marks), which reads as a dot in a chip (Faheem, 26 Oct); a tighter view box draws it about half again as large.
 */
export function VariantDiamond(props: {style?: CSSProperties}) {
  return <RhombusIcon viewBox="3.5 3.5 18 18" {...props} />
}

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
 * A dimension's icon. It is purple, except on a selected row, where it takes the row's own
 * foreground (`selected`): purple and muted grey wash out on the selected fill.
 */
export function DimensionIcon(props: {name: string; selected?: boolean; style?: CSSProperties}) {
  const Icon = ICONS[props.name] ?? RhombusIcon
  return <Icon style={{...(props.selected ? undefined : PURPLE), ...props.style}} />
}
