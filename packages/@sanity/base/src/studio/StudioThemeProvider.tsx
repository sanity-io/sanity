import React from 'react'
import {ThemeProvider} from '@sanity/ui'
import {useLocation} from './location'

interface StudioThemeProviderProps {
  children: React.ReactChild
}

export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useLocation().__internal.activeWorkspace.theme
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
