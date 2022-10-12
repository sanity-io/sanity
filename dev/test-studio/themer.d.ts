declare module 'https://themer.sanity.build/api/hues?*' {
  interface Hue extends Omit<import('@sanity/color').ColorHueConfig, 'title' | 'midPoint'> {
    midPoint: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950
  }
  interface Hues {
    default: Hue
    transparent: Hue
    primary: Hue
    positive: Hue
    caution: Hue
    critical: Hue
  }
  export const hues: Hues
  type Theme = import('sanity').StudioTheme
  export function createTheme(_hues: Hues): Theme
  export const theme: Theme
}
