import React, {useRef, useEffect} from 'react'
import config from 'config:sanity'
import RootComponent from 'part:@sanity/base/root'
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
  const portalRef = useRef(document.createElement('div'))

  // attach the global portal element
  useEffect(() => {
    // set a data attribute for debugging
    portalRef.current.setAttribute('data-portal', '')

    if (rootRef.current) {
      rootRef.current.appendChild(portalRef.current)
    }

    return () => {
      if (rootRef.current) {
        rootRef.current.removeChild(portalRef.current)
      }
    }
  }, [])

  if (!projectId || !dataset) {
    return <MissingProjectConfig />
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <PortalProvider element={portalRef.current}>
        <UserColorManagerProvider manager={userColorManager}>
          <SnackbarProvider>
            <DevServerStatus />
            <ErrorHandler />
            <RootComponent />
            <VersionChecker />
          </SnackbarProvider>
        </UserColorManagerProvider>
      </PortalProvider>
    </div>
  )
}

export default SanityRoot
