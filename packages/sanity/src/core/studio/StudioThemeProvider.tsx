/* eslint-disable no-nested-ternary */

import React from 'react'
import {ThemeProvider, LayerProvider} from '@sanity/ui'
import {RootTheme} from '@sanity/ui/theme'
import {StudioTheme, defaultTheme} from '../theme'
import {usesLegacyThemerFonts} from '../theme/themer/themerFonts'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {ColorSchemeSetValueContext, ColorSchemeValueContext} from './colorScheme'

interface StudioThemeProviderProps {
  children: React.ReactNode
}

function getThemeValues(theme: StudioTheme): RootTheme {
  return {
    ...defaultTheme,
    v2: theme.v2,
    fonts: usesLegacyThemerFonts(theme.fonts)
      ? defaultTheme.fonts
      : theme.fonts ?? defaultTheme.fonts,
    color: theme.color ?? defaultTheme.color,
  }
}

/** @internal */
export function StudioThemeProvider({children}: StudioThemeProviderProps) {
  const theme = useActiveWorkspace().activeWorkspace.theme

  if (theme.__legacy) {
    const scheme = theme.__dark ? 'dark' : 'light'
    return (
      <ColorSchemeSetValueContext.Provider value={false}>
        <ColorSchemeValueContext.Provider value={scheme}>
          <ThemeProvider scheme={scheme} theme={getThemeValues(theme)}>
            <LayerProvider>{children}</LayerProvider>
          </ThemeProvider>
        </ColorSchemeValueContext.Provider>
      </ColorSchemeSetValueContext.Provider>
    )
  }

  return (
    <ThemeProvider theme={getThemeValues(theme)}>
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}
