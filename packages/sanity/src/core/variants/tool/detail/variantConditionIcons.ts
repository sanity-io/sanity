import {CalendarIcon} from '@sanity/icons/Calendar'
import {CaseIcon} from '@sanity/icons/Case'
import {DesktopIcon} from '@sanity/icons/Desktop'
import {EarthAmericasIcon} from '@sanity/icons/EarthAmericas'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {FilterIcon} from '@sanity/icons/Filter'
import {MobileDeviceIcon} from '@sanity/icons/MobileDevice'
import {PackageIcon} from '@sanity/icons/Package'
import {PinIcon} from '@sanity/icons/Pin'
import {RocketIcon} from '@sanity/icons/Rocket'
import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'
import {StarIcon} from '@sanity/icons/Star'
import {TagIcon} from '@sanity/icons/Tag'
import {TargetIcon} from '@sanity/icons/Target'
import {TranslateIcon} from '@sanity/icons/Translate'
import {UserIcon} from '@sanity/icons/User'
import {UsersIcon} from '@sanity/icons/Users'
import {type ComponentType} from 'react'

/**
 * Icon per common variant targeting *dimension* (the key of a condition — "audience", "location",
 * "market", …). A variant's conditions are the dimensions along which content is personalized, so
 * giving each a recognizable glyph turns a flat key/value list into a scannable, purposeful panel
 * and lets a definition with several dimensions still read clearly.
 *
 * Keys are matched case-insensitively against the normalized (lowercased, singularized) condition
 * key. Unknown dimensions fall back to a neutral "filter" glyph — every condition is, structurally,
 * a filter on the audience.
 *
 * @internal
 */
const DIMENSION_ICONS: Record<string, ComponentType> = {
  audience: UsersIcon,
  segment: TargetIcon,
  cohort: TargetIcon,
  role: UserIcon,
  location: PinIcon,
  region: EarthAmericasIcon,
  country: EarthGlobeIcon,
  market: EarthGlobeIcon,
  geo: EarthGlobeIcon,
  locale: TranslateIcon,
  language: TranslateIcon,
  lang: TranslateIcon,
  device: MobileDeviceIcon,
  platform: DesktopIcon,
  environment: DesktopIcon,
  env: DesktopIcon,
  os: DesktopIcon,
  brand: TagIcon,
  campaign: RocketIcon,
  plan: StarIcon,
  tier: StarIcon,
  subscription: StarIcon,
  industry: CaseIcon,
  vertical: CaseIcon,
  category: PackageIcon,
  product: PackageIcon,
  channel: SplitVerticalIcon,
  source: SplitVerticalIcon,
  date: CalendarIcon,
  season: CalendarIcon,
}

/**
 * Resolves the glyph for a condition dimension key. Normalizes case and a trailing plural "s" so
 * "Audiences" and "audience" map alike; unknown keys get the neutral fallback.
 *
 * @internal
 */
export function getVariantConditionIcon(key: string): ComponentType {
  const normalized = key.trim().toLowerCase()

  return DIMENSION_ICONS[normalized] ?? DIMENSION_ICONS[normalized.replace(/s$/, '')] ?? FilterIcon
}
