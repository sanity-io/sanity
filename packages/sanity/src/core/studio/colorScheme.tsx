import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {studioTheme, ThemeColorSchemeKey, ThemeProvider, usePrefersDark} from '@sanity/ui'

const LOCAL_STORAGE_KEY = 'sanityStudio:ui:colorScheme'

function localStorageManager() {
  const supportsLocalStorage = typeof window !== 'undefined' && window.localStorage

  function getItem(key: string) {
    return supportsLocalStorage ? window.localStorage.getItem(key) : undefined
  }

  function setItem(key: string, value: string) {
    return supportsLocalStorage ? window.localStorage.setItem(key, value) : undefined
  }

  function removeItem(key: string) {
    return supportsLocalStorage ? window.localStorage.removeItem(key) : undefined
  }

  return {getItem, setItem, removeItem}
}

/** @internal */
export const ColorSchemeContext = createContext<{
  /** The current color scheme */
  scheme: ThemeColorSchemeKey
  /** Set the color scheme and store it in local storage */
  setScheme: (colorScheme: ThemeColorSchemeKey) => void
  /** A boolean indicating whether the user is using the system color scheme */
  usingSystemScheme: boolean
  /** Clear the stored color scheme from local storage and use the system color scheme */
  clearStoredScheme: () => void
} | null>(null)

/** @internal */
export interface ColorSchemeProviderProps {
  children: React.ReactNode
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
}

/** @internal */
export function ColorSchemeProvider({
  children,
  onSchemeChange,
  scheme: schemeProp,
}: ColorSchemeProviderProps) {
  const {getItem, setItem, removeItem} = useMemo(() => localStorageManager(), [])

  // The system color scheme
  const prefersDark = usePrefersDark()
  const systemScheme = prefersDark ? 'dark' : 'light'

  // The color scheme stored in local storage
  const storedScheme = getItem?.(LOCAL_STORAGE_KEY) as ThemeColorSchemeKey | undefined

  // A state indicating whether the user is using the system color scheme (mainly used to reflect what the user has selected in the UI)
  const [usingSystemScheme, setUsingSystemScheme] = useState<boolean>(!storedScheme)

  // The initial scheme to use
  const initialScheme = (schemeProp || storedScheme || systemScheme) as ThemeColorSchemeKey
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>(initialScheme)

  // Store the scheme in local storage when it changes (unless it's the system scheme)
  const handleSetScheme = useCallback(
    (nextScheme: ThemeColorSchemeKey) => {
      // Safety check to make sure we only store valid scheme keys
      if (nextScheme === 'dark' || nextScheme === 'light') {
        setItem?.(LOCAL_STORAGE_KEY, nextScheme)
        setScheme(nextScheme)
        onSchemeChange?.(nextScheme)
        setUsingSystemScheme(false)
      }
    },
    [onSchemeChange, setItem]
  )

  // Remove the stored scheme from local storage and set the scheme to the system scheme
  const clearStoredScheme = useCallback(() => {
    removeItem?.(LOCAL_STORAGE_KEY)
    setScheme(systemScheme)
    onSchemeChange?.(systemScheme)
    setUsingSystemScheme(true)
  }, [onSchemeChange, removeItem, systemScheme])

  // React to changes in the system settings.
  // If the user doesn't have a stored scheme in local storage, use the system scheme.
  useEffect(() => {
    if (!storedScheme) {
      setScheme(systemScheme)
      setUsingSystemScheme(true)
    }
  }, [onSchemeChange, storedScheme, systemScheme])

  const colorScheme = useMemo(
    () => ({scheme, setScheme: handleSetScheme, usingSystemScheme, clearStoredScheme}),
    [clearStoredScheme, handleSetScheme, scheme, usingSystemScheme]
  )

  return (
    <ColorSchemeContext.Provider value={colorScheme}>
      {/* Note: this is a fallback ThemeProvider that is for any components */}
      {/* that may render before the StudioThemeProvider renders. this is */}
      {/* required because the StudioThemeProvider has a dependence on the */}
      {/* active workspace provided via the ActiveWorkspaceMatcher */}
      <ThemeProvider scheme={scheme} theme={studioTheme} tone="transparent">
        {children}
      </ThemeProvider>
    </ColorSchemeContext.Provider>
  )
}

/** @internal */
export function useColorScheme() {
  const value = useContext(ColorSchemeContext)
  if (!value) throw new Error('Could not find `colorScheme` context')
  return value
}
