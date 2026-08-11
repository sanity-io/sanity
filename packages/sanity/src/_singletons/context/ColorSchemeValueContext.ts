import {createContext} from 'sanity/_createContext'

import type {StudioThemeColorSchemeKey} from '../../core/theme/types'

/**
 * Used to keep track of the internal value, which can be "system" in addition to "light" and "dark"
 * @internal
 */
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export const ColorSchemeValueContext = createContext<StudioThemeColorSchemeKey | null>(
  'sanity/_singletons/context/color-scheme-value',
  null,
)
