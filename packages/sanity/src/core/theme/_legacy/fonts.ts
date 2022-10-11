import {studioTheme as defaults, ThemeFonts} from '@sanity/ui'
import {LegacyThemeProps} from './types'

export function buildFonts(cssCustomProperties: LegacyThemeProps): ThemeFonts {
  return {
    ...defaults.fonts,
    code: {
      ...defaults.fonts.code,
      family: cssCustomProperties['--font-family-monospace'] || defaults.fonts.code.family,
    },
    heading: {
      ...defaults.fonts.heading,
      family: cssCustomProperties['--font-family-base'] || defaults.fonts.code.family,
    },
    label: {
      ...defaults.fonts.label,
      family: cssCustomProperties['--font-family-base'] || defaults.fonts.code.family,
    },
    text: {
      ...defaults.fonts.text,
      family: cssCustomProperties['--font-family-base'] || defaults.fonts.code.family,
    },
  }
}
