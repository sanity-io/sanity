import React, {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {ThemeColorSchemeKey, usePrefersDark} from '@sanity/ui'

const ColorSchemeContext = createContext<{
  scheme: ThemeColorSchemeKey
  setScheme: (colorScheme: ThemeColorSchemeKey) => void
} | null>(null)

interface ColorSchemeProviderProps {
  children: React.ReactNode
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
}

export function ColorSchemeProvider({
  children,
  onSchemeChange,
  scheme: schemeProp,
}: ColorSchemeProviderProps) {
  const prefersDark = usePrefersDark()
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>(schemeProp || 'light')

  // if the preferred color scheme changes, then react to this change
  useEffect(() => {
    const nextScheme = prefersDark ? 'dark' : 'light'
    setScheme(nextScheme)
    onSchemeChange?.(nextScheme)
  }, [onSchemeChange, prefersDark])

  const colorScheme = useMemo(() => ({scheme, setScheme}), [scheme])

  return <ColorSchemeContext.Provider value={colorScheme}>{children}</ColorSchemeContext.Provider>
}

export function useColorScheme() {
  const value = useContext(ColorSchemeContext)
  if (!value) throw new Error('Could not find `colorScheme` context')
  return value
}
