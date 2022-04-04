import React from 'react'
import Refractor from 'react-refractor'
import bash from 'refractor/lang/bash'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {History} from 'history'
import {LayerProvider, ThemeColorSchemeKey, ToastProvider} from '@sanity/ui'
import {SanityConfig} from '../config'
import {UserColorManagerProvider} from '../user-color'
import {ResourceCacheProvider} from '../datastores/ResourceCacheProvider'
import {ConfigProvider} from './config'
import {ColorSchemeProvider} from './colorScheme'
import {LocationProvider} from './location'
import {StudioThemeProvider} from './StudioThemeProvider'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {WorkspaceResolver} from './components'
import {LoadingScreen} from './screens'
import {AuthBoundary} from './AuthBoundary'
import {LoginScreen} from './screens/login'
import {Z_OFFSET} from './constants'

Refractor.registerLanguage(bash)
Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

export interface StudioProviderProps {
  children: React.ReactNode
  config: SanityConfig
  history?: History
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
}

export function StudioProvider({
  children,
  config,
  history,
  onSchemeChange,
  scheme,
}: StudioProviderProps) {
  return (
    <ConfigProvider config={config}>
      <ColorSchemeProvider onSchemeChange={onSchemeChange} scheme={scheme}>
        <StudioErrorBoundary>
          <LocationProvider history={history} noRoute={<>no route</>}>
            <StudioThemeProvider>
              <ToastProvider paddingY={7} zOffset={Z_OFFSET.toast}>
                <LayerProvider>
                  <UserColorManagerProvider>
                    <AuthBoundary loginScreen={LoginScreen}>
                      <WorkspaceResolver loadingScreen={<LoadingScreen />}>
                        <ResourceCacheProvider>{children}</ResourceCacheProvider>
                      </WorkspaceResolver>
                    </AuthBoundary>
                  </UserColorManagerProvider>
                </LayerProvider>
              </ToastProvider>
            </StudioThemeProvider>
          </LocationProvider>
        </StudioErrorBoundary>
      </ColorSchemeProvider>
    </ConfigProvider>
  )
}
