import type {StudioThemeColorSchemeKey} from '../../core/theme/types'
import {createContext} from 'sanity/_createContext'

/**
 * The setter for ColorSchemeValueContext, in a separate context to avoid unnecessary re-renders
 * If set to false then the UI should adjust to reflect that the Studio can't change the color scheme
 * @internal
 */
export const ColorSchemeSetValueContext = createContext<
  ((nextScheme: StudioThemeColorSchemeKey) => void) | false | null
>('sanity/_singletons/context/color-scheme-set-value', null)
