import {studioTheme as defaultTheme, ThemeColorCard} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'

const defaultLightScheme = defaultTheme.color.light

const customCard: ThemeColorCard = {
  tones: {
    ...defaultLightScheme.card.tones,
    default: {
      ...defaultLightScheme.card.tones.default,
      enabled: {
        ...defaultLightScheme.card.tones.default.enabled,
        bg: legacyTheme['--component-bg'],
        fg: legacyTheme['--component-text-color'],
      },
    },
    transparent: {
      ...defaultLightScheme.card.tones.transparent,
      enabled: {
        ...defaultLightScheme.card.tones.transparent.enabled,
        bg: legacyTheme['--body-bg'],
        fg: legacyTheme['--body-text'],
      },
    },
  },
}

const lightScheme = {
  ...defaultLightScheme,
  card: customCard,
}

export default {
  ...defaultTheme,
  color: {
    ...defaultTheme.color,
    light: lightScheme,
  },
  media: [
    parseInt(legacyTheme['--screen-medium-break'], 10) || 512,
    parseInt(legacyTheme['--screen-default-break'], 10) || 640,
    parseInt(legacyTheme['--screen-large-break'], 10) || 960,
    parseInt(legacyTheme['--screen-xlarge-break'], 10) || 1600,
  ],
}
