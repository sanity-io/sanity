import React from 'react'

import styles from './NoChanges.css'

export function NoChanges() {
  return (
    <div className={styles.root}>
      <div className={styles.box}>
        <h3 className={styles.heading}>There are no changes</h3>

        <div className={styles.content}>
          <p>
            Either edit the document or change the selection in the timeline menu to see the changes
            appear in this panel.
          </p>
        </div>
      </div>
    </div>
  )
}
