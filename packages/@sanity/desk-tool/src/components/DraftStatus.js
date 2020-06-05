import EditIcon from 'part:@sanity/base/edit-icon'
import React from 'react'

import styles from './ItemStatus.css'

const DraftStatus = () => (
  <div
    className={styles.draftBadge}
    role="image"
    aria-label="There are unpublished edits"
    title="There are unpublished edits"
  >
    <EditIcon />
  </div>
)

export default DraftStatus
