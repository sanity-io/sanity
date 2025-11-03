import {type ColorScheme} from '@sanity/ui/theme'

/**
 * Used to specify light or dark mode, or to respect system settings (prefers-color-scheme media query) use 'system'
 * @public
 */
export type StudioColorScheme = ColorScheme | 'system'
