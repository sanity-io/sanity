import React from 'react'
import RootComponent from 'part:@sanity/base/root'
import VersionChecker from './VersionChecker'
import styles from './styles/SanityRoot.css'

function SanityRoot() {
  return (
    <div className={styles.root}>
      <RootComponent />
      <VersionChecker />
    </div>
  )
}

export default SanityRoot
