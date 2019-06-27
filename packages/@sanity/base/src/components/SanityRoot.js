import React from 'react'
import config from 'config:sanity'
import RootComponent from 'part:@sanity/base/root'
import ErrorHandler from './ErrorHandler'
import VersionChecker from './VersionChecker'
import MissingProjectConfig from './MissingProjectConfig'
import styles from './styles/SanityRoot.css'

function SanityRoot() {
  const {projectId, dataset} = config.api || {}
  if (!projectId || !dataset) {
    return <MissingProjectConfig />
  }

  return (
    <div className={styles.root}>
      <ErrorHandler />
      <RootComponent />
      <VersionChecker />
    </div>
  )
}

export default SanityRoot
