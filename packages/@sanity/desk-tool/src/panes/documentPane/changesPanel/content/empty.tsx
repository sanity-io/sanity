import React from 'react'

import styles from './empty.css'

export function EmptyContent() {
  return (
    <>
      <h3 className={styles.heading}>There are no changes to this document</h3>

      <div className={styles.content}>
        <p>
          Either edit the document or change the selection in the timeline menu to see the changes
          appear in this panel.
        </p>
      </div>
    </>
  )
}
