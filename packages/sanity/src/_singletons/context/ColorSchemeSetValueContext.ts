import {createContext} from 'sanity/_createContext'

import type {StudioThemeColorSchemeKey} from '../../core/theme/types'

/**
 * The setter for ColorSchemeValueContext, in a separate context to avoid unnecessary re-renders
 * If set to false then the UI should adjust to reflect that the Studio can't change the color scheme
 * @internal
 */
export const ColorSchemeSetValueContext = createContext<
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ((nextScheme: StudioThemeColorSchemeKey) => void) | false | null
>('sanity/_singletons/context/color-scheme-set-value', null)
