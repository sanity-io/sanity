import React from 'react'
import Spinner from 'part:@sanity/components/loading/spinner'

import styles from './loading.css'

export function LoadingContent() {
  return (
    <div className={styles.root}>
      <Spinner center className={styles.spinner} message="Loading changes…" />
    </div>
  )
}
