import {RootTheme, studioTheme as defaults, ThemeColorSchemes} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'

// For debugging purposes
declare global {
  interface Window {
    __sanityLegacyTheme: Record<string, string>
  }
}
window.__sanityLegacyTheme = legacyTheme

// NOTE: This mapping is needed only in a transition period between legacy CSS custom properties,
// and the new Theme API provided by Sanity UI.
const color: ThemeColorSchemes = {
  ...defaults.color,
  light: {
    ...defaults.color.light,
    default: {
      ...defaults.color.light.default,
      base: {
        ...defaults.color.light.default.base,
        bg: legacyTheme['--component-bg'],
        fg: legacyTheme['--component-text-color'],
        border: legacyTheme['--hairline-color'],
      },
      card: {
        ...defaults.color.light.default.card,
        enabled: {
          ...defaults.color.light.default.card.enabled,
          bg: legacyTheme['--component-bg'],
          fg: legacyTheme['--component-text-color'],
          border: legacyTheme['--hairline-color'],
        },
      },
    },
    transparent: {
      ...defaults.color.light.transparent,
      base: {
        ...defaults.color.light.transparent.base,
        bg: legacyTheme['--body-bg'],
        fg: legacyTheme['--body-text'],
        border: legacyTheme['--hairline-color'],
      },
      card: {
        ...defaults.color.light.transparent.card,
        enabled: {
          ...defaults.color.light.transparent.card.enabled,
          bg: legacyTheme['--body-bg'],
          fg: legacyTheme['--body-text'],
          border: legacyTheme['--hairline-color'],
        },
      },
    },
  },
}

export const theme: RootTheme = {
  ...defaults,
  color,
  media: [
    parseInt(legacyTheme['--screen-medium-break'], 10) || 512,
    parseInt(legacyTheme['--screen-default-break'], 10) || 640,
    parseInt(legacyTheme['--screen-large-break'], 10) || 960,
    parseInt(legacyTheme['--screen-xlarge-break'], 10) || 1600,
  ],
  focusRing: {
    offset: -1,
    width: 2,
  },
}
