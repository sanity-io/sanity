import type {RootTheme, ThemeColorSchemeKey} from '@sanity/ui'

/** @public */
export interface StudioTheme extends RootTheme {
  /** @internal */
  __dark?: boolean
  /** @internal */
  __legacy?: boolean
}

/**
 * Used to specify light or dark mode, or to respect system settings (prefers-color-scheme media query) use 'system'
 * @public
 */
export type StudioThemeColorSchemeKey = ThemeColorSchemeKey | 'system'
