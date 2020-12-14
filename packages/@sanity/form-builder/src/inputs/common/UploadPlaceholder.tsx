import React from 'react'
import {ClipboardImageIcon, UploadIcon} from '@sanity/icons'

import styles from './UploadPlaceholder.css'

type UploadPlaceholderProps = {
  hasFocus?: boolean
  fileType?: 'image' | 'file'
}

export default React.memo(function UploadPlaceholder({
  hasFocus,
  fileType = 'file',
}: UploadPlaceholderProps) {
  return (
    <div className={hasFocus ? styles.hasFocus : styles.noFocus}>
      <div className={styles.inner}>
        <div className={styles.dropFile}>
          <div className={styles.iconContainer}>
            <UploadIcon />
          </div>
          <p className={styles.strong}>
            <span>{`Drop ${fileType}`}</span>
          </p>
        </div>
        <div className={styles.pasteFile}>
          <div className={styles.iconContainer}>
            <ClipboardImageIcon />
          </div>
          <div>
            <p className={styles.strong}>
              <span>{`Paste ${fileType}`}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
