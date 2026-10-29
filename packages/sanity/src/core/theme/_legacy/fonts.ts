import {studioTheme as defaults, type ThemeFonts} from '@sanity/ui'

import {type LegacyThemeProps} from './types'

/**
 * @deprecated – Will be removed in upcoming major version
 */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function buildFonts(cssCustomProperties: LegacyThemeProps): ThemeFonts {
  return {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    ...defaults.fonts,
    code: {
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      ...defaults.fonts.code,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      family: cssCustomProperties['--font-family-monospace'] || defaults.fonts.code.family,
    },
    heading: {
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      ...defaults.fonts.heading,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      family: cssCustomProperties['--font-family-base'] || defaults.fonts.code.family,
    },
    label: {
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      ...defaults.fonts.label,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      family: cssCustomProperties['--font-family-base'] || defaults.fonts.code.family,
    },
    text: {
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      ...defaults.fonts.text,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      family: cssCustomProperties['--font-family-base'] || defaults.fonts.code.family,
    },
  }
}
