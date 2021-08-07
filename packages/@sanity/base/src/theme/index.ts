// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {RootTheme, studioTheme as defaults} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'
import {color} from './color'
import {fonts} from './fonts'

// For debugging purposes
declare global {
  interface Window {
    __sanityLegacyTheme: Record<string, string>
  }
}

window.__sanityLegacyTheme = legacyTheme

/**
 * The theme object used to configure theming of `@sanity/ui`.
 */
export const theme: RootTheme = {
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
