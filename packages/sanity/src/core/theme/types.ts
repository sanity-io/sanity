import type {RootTheme, ThemeColorSchemeKey} from '@sanity/ui/theme'

/** @public */
export interface StudioTheme
  extends Omit<
    RootTheme,
    | 'avatar'
    | 'button'
    | 'container'
    | 'focusRing'
    | 'input'
    | 'layer'
    | 'media'
    | 'radius'
    | 'shadows'
    | 'space'
    | 'styles'
    | 'color'
    | 'fonts'
  > {
  /** @internal */
  __dark?: boolean
  /** @internal */
  __legacy?: boolean
  /**
   * @deprecated only colors and fonts are customizable
   */
  avatar?: RootTheme['avatar']
  /**
   * @deprecated only colors and fonts are customizable
   */
  button?: RootTheme['button']
  /**
   * @deprecated only colors and fonts are customizable
   */
  container?: RootTheme['container']
  /**
   * @deprecated only colors and fonts are customizable
   */
  focusRing?: RootTheme['focusRing']
  /**
   * @deprecated only colors and fonts are customizable
   */
  input?: RootTheme['input']
  /**
   * @deprecated only colors and fonts are customizable
   */
  layer?: RootTheme['layer']

  /**
   * @deprecated only colors and fonts are customizable
   */
  media?: RootTheme['media']
  /**
   * @deprecated only colors and fonts are customizable
   */
  radius?: RootTheme['radius']
  /**
   * @deprecated only colors and fonts are customizable
   */
  shadows?: RootTheme['shadows']
  /**
   * @deprecated only colors and fonts are customizable
   */
  space?: RootTheme['space']
  /**
   * @deprecated only colors and fonts are customizable
   */
  styles?: RootTheme['styles']

  color?: RootTheme['color']
  fonts?: RootTheme['fonts']
}

/**
 * Used to specify light or dark mode, or to respect system settings (prefers-color-scheme media query) use 'system'
 * @public
 */
export type StudioThemeColorSchemeKey = ThemeColorSchemeKey | 'system'
