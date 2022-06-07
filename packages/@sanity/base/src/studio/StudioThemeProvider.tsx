import React from 'react'
import {ThemeProvider, LayerProvider, ToastProvider} from '@sanity/ui'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {useColorScheme} from './colorScheme'
import {Z_OFFSET} from './constants'

interface StudioThemeProviderProps {
  children: React.ReactChild
}

export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useActiveWorkspace().activeWorkspace.theme
  const {scheme} = useColorScheme()

  return (
    <ThemeProvider scheme={scheme} theme={theme}>
      <ToastProvider paddingY={7} zOffset={Z_OFFSET.toast}>
        <LayerProvider>{children}</LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
