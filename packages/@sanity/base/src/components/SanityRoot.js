import React from 'react'
import config from 'config:sanity'
import RootComponent from 'part:@sanity/base/root'
import ErrorHandler from './ErrorHandler'
import VersionChecker from './VersionChecker'
import MissingProjectConfig from './MissingProjectConfig'
import styles from './styles/SanityRoot.css'
import SnackbarProvider from 'part:@sanity/components/snackbar/default'

function SanityRoot() {
  const {projectId, dataset} = config.api || {}
  if (!projectId || !dataset) {
    return <MissingProjectConfig />
  }

  const options = {
    // preventDuplicate: true
  }
  // TODO: Wrap snackbar provider around app, provide context
  return (
    <div className={styles.root}>
      <ErrorHandler />
      <RootComponent />
      <VersionChecker />
      <SnackbarProvider options={options}/>
    </div>
  )
}

export default SanityRoot
