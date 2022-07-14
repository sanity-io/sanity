import React from 'react'
import {ThemeProvider, LayerProvider} from '@sanity/ui'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {useColorScheme} from './colorScheme'

interface StudioThemeProviderProps {
  children: React.ReactChild
}

export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useActiveWorkspace().activeWorkspace.theme
  const {scheme} = useColorScheme()

  return (
    <ThemeProvider scheme={scheme} theme={theme}>
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}
