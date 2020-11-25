import {ThemeCardColor} from '@sanity/ui'
declare const _default: {
  color: {
    light: {
      card: ThemeCardColor
      avatar: {
        gray: string
        blue: string
        cyan: string
        green: string
        yellow: string
        orange: string
        red: string
        magenta: string
        purple: string
      }
      badge: {
        tones: {
          default: import('@sanity/ui').ThemeBadgeColor
          brand: import('@sanity/ui').ThemeBadgeColor
          positive: import('@sanity/ui').ThemeBadgeColor
          caution: import('@sanity/ui').ThemeBadgeColor
          critical: import('@sanity/ui').ThemeBadgeColor
        }
      }
      button: {
        tones: {
          default: import('@sanity/ui').ThemeButtonColor
          brand: import('@sanity/ui').ThemeButtonColor
          positive: import('@sanity/ui').ThemeButtonColor
          caution: import('@sanity/ui').ThemeButtonColor
          critical: import('@sanity/ui').ThemeButtonColor
        }
      }
      syntax: {
        tones: {
          default: import('@sanity/ui').ThemeSyntaxColor
        }
      }
      switch: {
        tones: {
          default: {
            enabled: {
              thumb: string
              off: {
                bg: string
              }
              on: {
                bg: string
              }
            }
            disabled: {
              thumb: string
              off: {
                bg: string
              }
              on: {
                bg: string
              }
            }
          }
        }
      }
      input: {
        tones: {
          default: {
            enabled: import('@sanity/ui').ThemeInputStateColor
            disabled: import('@sanity/ui').ThemeInputStateColor
            hovered: import('@sanity/ui').ThemeInputStateColor
          }
        }
      }
    }
    dark: import('@sanity/ui').ThemeColor
  }
  media: number[]
  avatar: {
    distance: number[]
    size: number[]
  }
  container: number[]
  fonts: import('@sanity/ui').ThemeFonts
  radius: number[]
  shadows: import('@sanity/ui').ThemeShadow[]
  space: number[]
  input: import('@sanity/ui').ThemeInput
}
export default _default
