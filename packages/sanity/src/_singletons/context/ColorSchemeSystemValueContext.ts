import {createContext} from 'react'

/**
 * The scheme the OS prefers, which a "system" value in `ColorSchemeValueContext` resolves to
 * @internal
 */
export const ColorSchemeSystemValueContext = createContext<'light' | 'dark' | null>(null)
