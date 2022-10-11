/* eslint-disable no-nested-ternary */

import React from 'react'
import {ThemeProvider, LayerProvider} from '@sanity/ui'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {ColorSchemeContext, useColorScheme} from './colorScheme'

interface StudioThemeProviderProps {
  children: React.ReactChild
}

/** @internal */
export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useActiveWorkspace().activeWorkspace.theme
  const colorScheme = useColorScheme()
  const scheme = theme.__legacy ? (theme.__dark ? 'dark' : 'light') : colorScheme.scheme

  return (
    <ColorSchemeContext.Provider value={{...colorScheme, scheme}}>
      <ThemeProvider scheme={scheme} theme={theme} tone="transparent">
        <LayerProvider>{children}</LayerProvider>
      </ThemeProvider>
    </ColorSchemeContext.Provider>
  )
}
