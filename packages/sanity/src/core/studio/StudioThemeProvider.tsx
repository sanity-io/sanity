/* eslint-disable no-nested-ternary */

import React from 'react'
import {ThemeProvider, LayerProvider} from '@sanity/ui'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {ColorSchemeSetValueContext, ColorSchemeValueContext} from './colorScheme'

interface StudioThemeProviderProps {
  children: React.ReactNode
}

/** @internal */
export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useActiveWorkspace().activeWorkspace.theme

  if (theme.__legacy) {
    const scheme = theme.__dark ? 'dark' : 'light'
    return (
      <ColorSchemeSetValueContext.Provider value={false}>
        <ColorSchemeValueContext.Provider value={scheme}>
          <ThemeProvider scheme={scheme} theme={theme} tone="transparent">
            <LayerProvider>{children}</LayerProvider>
          </ThemeProvider>
        </ColorSchemeValueContext.Provider>
      </ColorSchemeSetValueContext.Provider>
    )
  }

  return (
    <ThemeProvider theme={theme} tone="transparent">
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}
