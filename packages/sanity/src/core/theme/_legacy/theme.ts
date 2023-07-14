import {black, blue, gray, green, red, white, yellow} from '@sanity/color'
import {studioTheme as defaults} from '@sanity/ui'
import {StudioTheme} from '../types'
import {buildColor} from './color'
import {buildFonts} from './fonts'
import {_isDark} from './helpers'
import {buildLegacyPalette} from './palette'
import {buildLegacyTones} from './tones'
import {LegacyThemeProps} from './types'

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
 *
 * @public
 */
export function buildLegacyTheme(partialLegacyTheme: Partial<LegacyThemeProps>): StudioTheme {
  const legacyTheme = resolveLegacyTheme(partialLegacyTheme)
  const legacyPalette = buildLegacyPalette(legacyTheme)
  const legacyTones = buildLegacyTones(legacyPalette)

  const color = buildColor(legacyPalette, legacyTones)
  const fonts = buildFonts(legacyTheme)

  return {
    __dark: _isDark(color.light.default.base.bg, color.light.default.base.fg),
    __legacy: true,
    ...defaults,
    color,
    focusRing: {
      offset: -1,
      width: 2,
    },
    fonts,
    media: [
      parseInt(legacyTheme['--screen-medium-break'], 10) || 512,
      parseInt(legacyTheme['--screen-default-break'], 10) || 640,
      parseInt(legacyTheme['--screen-large-break'], 10) || 960,
      parseInt(legacyTheme['--screen-xlarge-break'], 10) || 1600,
    ],
  }
}

const defaultCustomProperties: LegacyThemeProps = {
  '--font-family-monospace': defaults.fonts.code.family,
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
  '--screen-medium-break': '512px',
  '--screen-default-break': '640px',
  '--screen-large-break': '960px',
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

function resolveLegacyTheme(legacyTheme: Partial<LegacyThemeProps>): LegacyThemeProps {
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
