// @flow
import React from 'react'
import styles from './styles/UploadPlaceholder.css'
import UploadIcon from 'part:@sanity/base/upload-icon'

export default function UploadPlaceholder() {
  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.iconContainer}>
          <UploadIcon />
        </div>
        <div>
          <p className={styles.strong}>
            <span>Paste file</span>
          </p>
          <p className={styles.light}>
            <span>…or drop it here</span>
          </p>
        </div>
      </div>
    </div>
  )
}
