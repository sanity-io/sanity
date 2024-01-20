import {type RootTheme, type ThemeColorSchemeKey} from '@sanity/ui/theme'

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
   * @deprecated this theme property is not configurable within the studio
   */
  avatar?: RootTheme['avatar']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  button?: RootTheme['button']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  container?: RootTheme['container']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  focusRing?: RootTheme['focusRing']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  input?: RootTheme['input']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  layer?: RootTheme['layer']

  /**
   * @deprecated this theme property is not configurable within the studio
   */
  media?: RootTheme['media']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  radius?: RootTheme['radius']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  shadows?: RootTheme['shadows']
  /**
   * @deprecated this theme property is not configurable within the studio
   */
  space?: RootTheme['space']
  /**
   * @deprecated this theme property is not configurable within the studio
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
