import {createContext} from 'sanity/_createContext'

import type {StudioColorScheme} from '../../core/theme/types'

/**
 * Used to keep track of the internal value, which can be "system" in addition to "light" and "dark"
 * @internal
 */
export const ColorSchemeValueContext = createContext<StudioColorScheme | null>(
  'sanity/_singletons/context/color-scheme-value',
  null,
)
