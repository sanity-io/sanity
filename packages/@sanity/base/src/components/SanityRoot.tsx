import {Card, ThemeColorProvider, ThemeProvider, useRootTheme} from '@sanity/ui'
import config from 'config:sanity'
import RootComponent from 'part:@sanity/base/root'
import {LayerProvider} from 'part:@sanity/components/layer'
import {PortalProvider} from 'part:@sanity/components/portal'
import SnackbarProvider from 'part:@sanity/components/snackbar/provider'
import React, {useState} from 'react'
import Refractor from 'react-refractor'
import jsx from 'refractor/lang/jsx'
import styled from 'styled-components'
import pkg from '../../package.json'
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

function AppProvider() {
  const [portalElement, setPortalElement] = useState(() => document.createElement('div'))

  try {
    useRootTheme()
  } catch (_) {
    return (
      <div style={{padding: 20, margin: '0 auto', maxWidth: '40rem'}}>
        <h1>Error: Missing theme context</h1>

        <p>
          This problem is usually caused by multiple versions of <code>@sanity/ui</code> in the same
          application.
        </p>

        <p>
          Make sure to install the same version of <code>@sanity/ui</code> as{' '}
          <code>@sanity/base</code>:
        </p>

        <pre style={{padding: 20, background: '#000', color: '#fff'}}>
          <code>npm install @sanity/ui@{pkg.dependencies['@sanity/ui']}</code>
        </pre>
      </div>
    )
  }

  return (
    <UserColorManagerProvider manager={userColorManager}>
      <PortalProvider element={portalElement}>
        <LayerProvider>
          <SnackbarProvider>
            <ThemeColorProvider tone="transparent">
              <GlobalStyle />
            </ThemeColorProvider>
            <Root scheme="light">
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
  )
}

function SanityRoot() {
  const {projectId, dataset} = config.api || {}

  if (!projectId || !dataset) {
    return <MissingProjectConfig />
  }

  return (
    <ThemeProvider theme={theme}>
      <AppProvider />
    </ThemeProvider>
  )
}

export default SanityRoot
