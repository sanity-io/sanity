import React from 'react'
import {ThemeProvider} from '@sanity/ui'
import {useLocation} from './location'
import {useColorScheme} from './colorScheme'

interface StudioThemeProviderProps {
  children: React.ReactChild
}

export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useLocation().__internal.activeWorkspace.theme
  const {scheme} = useColorScheme()

  return (
    <ThemeProvider scheme={scheme} theme={theme}>
      {children}
    </ThemeProvider>
  )
}
