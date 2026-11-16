import {type RootTheme, type ThemeColorSchemeKey} from '@sanity/ui/theme'

/**
 * Flags tracking customer usage of deprecated `--screen-*-break` keys in buildLegacyTheme.
 * Stored on the theme object to avoid module-level state issues in multi-workspace setups.
 * @internal
 */
export interface LegacyThemeDeprecatedFlags {
  screenMediumBreak: boolean
  screenDefaultBreak: boolean
  screenLargeBreak: boolean
  screenXlargeBreak: boolean
}

/** @public
 * @deprecated – Will be removed in upcoming major version
 * */
export interface StudioTheme extends Omit<
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
   * Flags tracking deprecated `--screen-*-break` keys passed to buildLegacyTheme.
   * @internal
   */
  __deprecatedLegacyThemeKeys?: LegacyThemeDeprecatedFlags
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
 * Used to specify light or dark mode, or to respect system settings (prefers-color-scheme media
 * query) use 'system'
 * @public
 */
export type StudioColorScheme = ThemeColorSchemeKey | 'system'

/**
 * Used to specify light or dark mode, or to respect system settings (prefers-color-scheme media
 * query) use 'system'
 * @public
 * @deprecated Use `StudioColorScheme` instead
 */
export type StudioThemeColorSchemeKey = StudioColorScheme
