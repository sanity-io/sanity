// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {studioTheme as defaults, ThemeFonts} from '@sanity/ui'
import cssCustomProperties from 'sanity:css-custom-properties'

export const fonts: ThemeFonts = {
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
