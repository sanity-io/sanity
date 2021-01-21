import {studioTheme as defaults, ThemeColorSchemes} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'
import {input} from './input'

// NOTE: This mapping is needed only in a transition period between legacy CSS custom properties,
// and the new Theme API provided by Sanity UI.
export const color: ThemeColorSchemes = {
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
      input,
      // @todo: button
      // @todo: card
      // @todo: spot
      // @todo: syntax
      // @todo: solid
      // @todo: muted
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
      input,
      // @todo: button
      // @todo: card
      // @todo: spot
      // @todo: syntax
      // @todo: solid
      // @todo: muted
    },
  },
}
