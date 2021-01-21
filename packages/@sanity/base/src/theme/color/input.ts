import {ThemeColorInput} from '@sanity/ui'
import legacyTheme from 'sanity:css-custom-properties'

export const input: ThemeColorInput = {
  default: {
    enabled: {
      bg: legacyTheme['--input-bg'],
      fg: legacyTheme['--input-color'],
      border: legacyTheme['--input-border-color'],
      placeholder: legacyTheme['--input-color-placeholder'],
    },
    disabled: {
      bg: legacyTheme['--input-bg-disabled'],
      fg: legacyTheme['--input-color-read-only'],
      border: legacyTheme['--input-border-color'],
      placeholder: legacyTheme['--input-color-placeholder'],
    },
    hovered: {
      bg: legacyTheme['--input-bg'],
      fg: legacyTheme['--input-color'],
      border: legacyTheme['--input-border-color-hover'],
      placeholder: legacyTheme['--input-color-placeholder'],
    },
  },
  invalid: {
    enabled: {
      bg: legacyTheme['--input-bg-invalid'],
      fg: legacyTheme['--input-color'],
      border: legacyTheme['--input-border-color-invalid'],
      placeholder: legacyTheme['--input-color-placeholder'],
    },
    disabled: {
      bg: legacyTheme['--input-bg-invalid'],
      fg: legacyTheme['--input-color'],
      border: legacyTheme['--input-border-color-invalid'],
      placeholder: legacyTheme['--input-color-placeholder'],
    },
    hovered: {
      bg: legacyTheme['--input-bg-invalid'],
      fg: legacyTheme['--input-color'],
      border: legacyTheme['--input-border-color-invalid'],
      placeholder: legacyTheme['--input-color-placeholder'],
    },
  },
}
