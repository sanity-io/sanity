import {createContext} from 'react'

import type {StudioThemeColorSchemeKey} from '../../../core/theme/types'

/**
 * The setter for ColorSchemeValueContext, in a separate context to avoid unnecessary re-renders
 * If set to false then the UI should adjust to reflect that the Studio can't change the color scheme
 * @internal
 */
export const ColorSchemeSetValueContext = createContext<
  ((nextScheme: StudioThemeColorSchemeKey) => void) | false | null
>(null)
