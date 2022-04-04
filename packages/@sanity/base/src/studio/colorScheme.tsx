import React, {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {
  studioTheme,
  ThemeColorSchemeKey,
  ThemeProvider,
  usePrefersDark,
  useRootTheme,
} from '@sanity/ui'

// ColorSchemeContext
const ColorSchemeContext = createContext<{
  scheme: ThemeColorSchemeKey
  setScheme: (colorScheme: ThemeColorSchemeKey) => void
} | null>(null)

interface ColorSchemeProviderProps {
  children: React.ReactNode
}

function useCurrentTheme() {
  try {
    return useRootTheme()
  } catch (_) {
    return undefined
  }
}

export function ColorSchemeProvider({children}: ColorSchemeProviderProps) {
  const theme = useCurrentTheme()?.theme || studioTheme
  const prefersDark = usePrefersDark()
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>('light')

  // if the preferred color scheme changes, then react to this change
  useEffect(() => {
    setScheme(prefersDark ? 'dark' : 'light')
  }, [prefersDark])

  const colorScheme = useMemo(() => ({scheme, setScheme}), [scheme])

  return (
    <ColorSchemeContext.Provider value={colorScheme}>
      <ThemeProvider scheme={scheme} theme={theme}>
        {children}
      </ThemeProvider>
    </ColorSchemeContext.Provider>
  )
}

export function useColorScheme() {
  const value = useContext(ColorSchemeContext)
  if (!value) throw new Error('Could not find `colorScheme` context')
  return value
}
