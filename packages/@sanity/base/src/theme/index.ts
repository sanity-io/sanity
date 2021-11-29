// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {RootTheme} from '@sanity/ui'
import {studioTheme as defaults} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'
import {color} from './color'
import {fonts} from './fonts'

const THEME_IS_DEFAULT_LEGACY = legacyTheme['--sanity-theme-default']

/**
 * The theme object used to configure theming of `@sanity/ui`.
 * @internal
 */
export const theme: RootTheme = {
  ...defaults,
  color: THEME_IS_DEFAULT_LEGACY ? defaults.color : color,
  focusRing: {
    offset: -1,
    width: 2,
  },
  fonts: THEME_IS_DEFAULT_LEGACY ? defaults.fonts : fonts,
  media: [
    parseInt(legacyTheme['--screen-medium-break'], 10) || 512,
    parseInt(legacyTheme['--screen-default-break'], 10) || 640,
    parseInt(legacyTheme['--screen-large-break'], 10) || 960,
    parseInt(legacyTheme['--screen-xlarge-break'], 10) || 1600,
  ],
}
