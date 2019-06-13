import React from 'react'
import RootComponent from 'part:@sanity/base/root'
import VersionChecker from './VersionChecker'
import ErrorHandler from './ErrorHandler'
import styles from './styles/SanityRoot.css'

function SanityRoot() {
  return (
    <div className={styles.root}>
      <ErrorHandler />
      <RootComponent />
      <VersionChecker />
    </div>
  )
}

export default SanityRoot
