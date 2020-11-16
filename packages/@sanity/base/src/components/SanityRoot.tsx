import React, {useRef, useState} from 'react'
import config from 'config:sanity'
import RootComponent from 'part:@sanity/base/root'
import {LayerProvider} from 'part:@sanity/components/layer'
import {PortalProvider} from 'part:@sanity/components/portal'
import SnackbarProvider from 'part:@sanity/components/snackbar/provider'
import {userColorManager, UserColorManagerProvider} from '../user-color'
import ErrorHandler from './ErrorHandler'
import VersionChecker from './VersionChecker'
import MissingProjectConfig from './MissingProjectConfig'
import styles from './styles/SanityRoot.css'
import DevServerStatus from './DevServerStatus'

function SanityRoot() {
  const {projectId, dataset} = config.api || {}
  const rootRef = useRef(null)
  const [portalElement, setPortalElement] = useState(() => document.createElement('div'))

  if (!projectId || !dataset) {
    return <MissingProjectConfig />
  }

  return (
    <UserColorManagerProvider manager={userColorManager}>
      <PortalProvider element={portalElement}>
        <LayerProvider>
          <SnackbarProvider>
            <div className={styles.root} ref={rootRef}>
              <DevServerStatus />
              <ErrorHandler />
              <RootComponent />
              <VersionChecker />
            </div>
            <div data-portal="" ref={setPortalElement} />
          </SnackbarProvider>
        </LayerProvider>
      </PortalProvider>
    </UserColorManagerProvider>
  )
}

export default SanityRoot
