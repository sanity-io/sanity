import React from 'react'
import {ThemeProvider, LayerProvider} from '@sanity/ui'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {useColorScheme} from './colorScheme'

interface StudioThemeProviderProps {
  children: React.ReactChild
}

/** @internal */
export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useActiveWorkspace().activeWorkspace.theme
  const {scheme} = useColorScheme()

  return (
    <ThemeProvider scheme={scheme} theme={theme} tone="transparent">
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}
