import {black, blue, gray, green, red, white, yellow} from '@sanity/color'
import {studioTheme as defaults} from '@sanity/ui'

import {type StudioTheme} from '../types'
import {buildColor} from './color'
import {buildFonts} from './fonts'
import {_isDark} from './helpers'
import {buildLegacyPalette} from './palette'
import {buildLegacyTones} from './tones'
import {type LegacyThemeProps} from './types'

/**
 * Flags tracking customer usage of deprecated `--screen-*-break` keys.
 * Set once per session when a customer explicitly passes these keys to buildLegacyTheme.
 * @internal
 */
export interface LegacyThemeDeprecatedFlags {
  screenMediumBreak: boolean
  screenDefaultBreak: boolean
  screenLargeBreak: boolean
  screenXlargeBreak: boolean
}

const deprecatedScreenBreakFlags: LegacyThemeDeprecatedFlags = {
  screenMediumBreak: false,
  screenDefaultBreak: false,
  screenLargeBreak: false,
  screenXlargeBreak: false,
}

/**
 * Returns the flags for deprecated `--screen-*-break` keys that customers have used.
 * @internal
 */
export function getLegacyThemeDeprecatedFlags(): LegacyThemeDeprecatedFlags {
  return {...deprecatedScreenBreakFlags}
}

/**
 * Resets the deprecated flags. Only for testing.
 * @internal
 */
export function _resetLegacyThemeDeprecatedFlags(): void {
  deprecatedScreenBreakFlags.screenMediumBreak = false
  deprecatedScreenBreakFlags.screenDefaultBreak = false
  deprecatedScreenBreakFlags.screenLargeBreak = false
  deprecatedScreenBreakFlags.screenXlargeBreak = false
}

/**
 * Build a Sanity UI theme from legacy CSS properties.
 *
 * @example
 * ```tsx
 * import {buildLegacyTheme, defineConfig} from 'sanity'
 *
 * export default defineConfig({
 *   // project configuration ...
 *
 *   // Customize theming
 *   theme: buildLegacyTheme({
 *     '--black': '#000',
 *     '--gray': '#777',
 *     '--focus-color': '#00f',
 *   })
 * })
 * ```
 *
 * @param partialLegacyTheme - Properties to override the theme with. See {@link LegacyThemeProps}
 * @public
 * @deprecated – Will be removed in upcoming major version
 */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function buildLegacyTheme(partialLegacyTheme: Partial<LegacyThemeProps>): StudioTheme {
  // Track customer usage of deprecated --screen-*-break keys
  if ('--screen-medium-break' in partialLegacyTheme) {
    deprecatedScreenBreakFlags.screenMediumBreak = true
  }
  if ('--screen-default-break' in partialLegacyTheme) {
    deprecatedScreenBreakFlags.screenDefaultBreak = true
  }
  if ('--screen-large-break' in partialLegacyTheme) {
    deprecatedScreenBreakFlags.screenLargeBreak = true
  }
  if ('--screen-xlarge-break' in partialLegacyTheme) {
    deprecatedScreenBreakFlags.screenXlargeBreak = true
  }

  const legacyTheme = resolveLegacyTheme(partialLegacyTheme)
  const legacyPalette = buildLegacyPalette(legacyTheme)
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const legacyTones = buildLegacyTones(legacyPalette)

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const color = buildColor(legacyPalette, legacyTones)
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const fonts = buildFonts(legacyTheme)

  return {
    __dark: _isDark(color.light.default.base.bg, color.light.default.base.fg),
    __legacy: true,
    color,
    fonts,
  }
}

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const defaultCustomProperties: LegacyThemeProps = {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  '--font-family-monospace': defaults.fonts.code.family,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  '--font-family-base': defaults.fonts.text.family,

  '--black': black.hex,
  '--white': white.hex,

  // Brand
  '--brand-primary': blue[500].hex,

  // Component
  '--component-bg': white.hex,
  '--component-text-color': black.hex,

  // Gray
  '--gray': gray[500].hex,
  '--gray-base': gray[500].hex,

  // Default button
  '--default-button-color': gray[500].hex,
  '--default-button-danger-color': red[500].hex,
  '--default-button-primary-color': blue[500].hex,
  '--default-button-success-color': green[500].hex,
  '--default-button-warning-color': yellow[500].hex,

  // Focus
  '--focus-color': blue[500].hex,

  // Screen
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  '--screen-medium-break': '512px',
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  '--screen-default-break': '640px',
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  '--screen-large-break': '960px',
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  '--screen-xlarge-break': '1600px',

  // State
  '--state-info-color': blue[500].hex,
  '--state-success-color': green[500].hex,
  '--state-warning-color': yellow[500].hex,
  '--state-danger-color': red[500].hex,

  // Navbar
  '--main-navigation-color': black.hex,
  '--main-navigation-color--inverted': white.hex,
}

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
function resolveLegacyTheme(legacyTheme: Partial<LegacyThemeProps>): LegacyThemeProps {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const props: LegacyThemeProps = {
    ...defaultCustomProperties,
    ...legacyTheme,
  }

  // Update properties (order matters)
  props['--focus-color'] = legacyTheme['--focus-color'] || props['--brand-primary']
  props['--default-button-primary-color'] =
    legacyTheme['--default-button-primary-color'] || props['--brand-primary']
  props['--main-navigation-color'] = legacyTheme['--main-navigation-color'] || props['--black']
  props['--main-navigation-color--inverted'] =
    legacyTheme['--main-navigation-color--inverted'] || props['--white']
  props['--state-info-color'] = legacyTheme['--brand-primary'] || props['--brand-primary']

  return props
}
