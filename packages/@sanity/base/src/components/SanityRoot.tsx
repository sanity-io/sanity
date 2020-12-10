import {Card, ThemeColorProvider, ThemeProvider} from '@sanity/ui'
import config from 'config:sanity'
import RootComponent from 'part:@sanity/base/root'
import {LayerProvider} from 'part:@sanity/components/layer'
import {PortalProvider} from 'part:@sanity/components/portal'
import SnackbarProvider from 'part:@sanity/components/snackbar/provider'
import React, {useState} from 'react'
import Refractor from 'react-refractor'
import jsx from 'refractor/lang/jsx'
import styled from 'styled-components'
import {theme} from '../theme'
import {userColorManager, UserColorManagerProvider} from '../user-color'
import ErrorHandler from './ErrorHandler'
import DevServerStatus from './DevServerStatus'
import {GlobalStyle} from './GlobalStyle'
import MissingProjectConfig from './MissingProjectConfig'
import VersionChecker from './VersionChecker'

Refractor.registerLanguage(jsx)

const Root = styled(Card).attrs({tone: 'transparent'})`
  height: 100%;
`

function SanityRoot() {
  const {projectId, dataset} = config.api || {}
  const [portalElement, setPortalElement] = useState(() => document.createElement('div'))
  const colorScheme = 'light'

  if (!projectId || !dataset) {
    return <MissingProjectConfig />
  }

  return (
    <ThemeProvider theme={theme}>
      <UserColorManagerProvider manager={userColorManager}>
        <PortalProvider element={portalElement}>
          <LayerProvider>
            <SnackbarProvider>
              <ThemeColorProvider tone="transparent">
                <GlobalStyle />
              </ThemeColorProvider>
              <Root scheme={colorScheme}>
                <DevServerStatus />
                <ErrorHandler />
                <RootComponent />
                <VersionChecker />
              </Root>
              <div data-portal="" ref={setPortalElement} />
            </SnackbarProvider>
          </LayerProvider>
        </PortalProvider>
      </UserColorManagerProvider>
    </ThemeProvider>
  )
}

export default SanityRoot
