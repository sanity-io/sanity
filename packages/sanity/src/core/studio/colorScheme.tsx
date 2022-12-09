import React, {createContext, useContext, useEffect, useMemo, useState} from 'react'
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

type StudioAppearance = ThemeColorSchemeKey | 'system'

/** @internal */
export const ColorSchemeContext = createContext<{
  scheme: ThemeColorSchemeKey
  appearance: StudioAppearance
  setScheme: (colorScheme: ThemeColorSchemeKey) => void
  setAppearance: (appearance: StudioAppearance) => void
} | null>(null)

/** @internal */
export interface ColorSchemeProviderProps {
  children: React.ReactNode
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
}

/** @internal */
export function ColorSchemeProvider(props: ColorSchemeProviderProps) {
  const {children, onSchemeChange, scheme: schemeProp} = props
  const {getItem, setItem, removeItem} = useMemo(() => localStorageManager(), [])

  // Read the stored scheme from local storage
  const storedScheme = getItem?.(LOCAL_STORAGE_KEY) as ThemeColorSchemeKey | undefined

  // Get the system scheme
  const prefersDark = usePrefersDark()
  const systemScheme = prefersDark ? 'dark' : 'light'

  // If there is a stored scheme, that means the user has set the appearance to "dark" or "light" and we should use that scheme
  // If there is no stored scheme, that means that the user has set the appearance to "system" or nothing at all, so we should use the system scheme
  const initialAppearance = (storedScheme ? storedScheme : 'system') as StudioAppearance
  const [appearance, setAppearance] = useState<StudioAppearance>(initialAppearance)

  // Set the initial scheme based on the schemeProp, stored scheme or system scheme
  const initialScheme = (schemeProp || storedScheme || systemScheme) as ThemeColorSchemeKey
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>(initialScheme)

  // React to appearance changes and update the scheme accordingly
  useEffect(() => {
    // If the appearance is set to "system", remove the stored scheme from local storage to allow system settings to take over
    if (appearance == 'system') {
      setScheme(systemScheme)
      onSchemeChange?.(systemScheme)
      removeItem?.(LOCAL_STORAGE_KEY)
    } else {
      // If the appearance is set to "dark" or "light", set the scheme to "dark" or "light" respectively and store the scheme in local storage
      setScheme(appearance)
      onSchemeChange?.(appearance)
      setItem?.(LOCAL_STORAGE_KEY, appearance)
    }
  }, [appearance, onSchemeChange, prefersDark, removeItem, setItem, systemScheme])

  const colorScheme = useMemo(
    () => ({
      appearance,
      scheme,
      setAppearance,
      setScheme,
    }),
    [appearance, scheme]
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
