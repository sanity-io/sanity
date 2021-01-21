import {RootTheme, studioTheme as defaults} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'
import {color} from './color'

// For debugging purposes
declare global {
  interface Window {
    __sanityLegacyTheme: Record<string, string>
  }
}

window.__sanityLegacyTheme = legacyTheme

export const theme: RootTheme = {
  ...defaults,
  color,
  focusRing: {
    offset: -1,
    width: 2,
  },
  media: [
    parseInt(legacyTheme['--screen-medium-break'], 10) || 512,
    parseInt(legacyTheme['--screen-default-break'], 10) || 640,
    parseInt(legacyTheme['--screen-large-break'], 10) || 960,
    parseInt(legacyTheme['--screen-xlarge-break'], 10) || 1600,
  ],
}
