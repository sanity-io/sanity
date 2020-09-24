import React from 'react'

import styles from './NoChanges.css'

export function NoChanges() {
  return (
    <div className={styles.root}>
      <div className={styles.box}>
        <h3 className={styles.heading}>There are no changes</h3>

        <div className={styles.content}>
          <p>
            Edit the document or select an older version in the timeline to see a list of changes
            appear in this panel.
          </p>
        </div>
      </div>
    </div>
  )
}
