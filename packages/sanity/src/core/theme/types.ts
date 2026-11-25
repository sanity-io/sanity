import {type RootTheme, type ThemeColorSchemeKey} from '@sanity/ui/theme'

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
