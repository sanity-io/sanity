import EditIcon from 'part:@sanity/base/edit-icon'
import React from 'react'
import {Tooltip} from 'react-tippy'

import styles from './ItemStatus.css'

const DraftStatus = () => (
  <Tooltip
    tabIndex={0}
    className={styles.itemStatus}
    title="There are unpublished edits"
    arrow
    theme="light"
    sticky
    size="small"
  >
    <div className={styles.draftBadge} role="image" aria-label="There are unpublished edits">
      <EditIcon />
    </div>
  </Tooltip>
)

export default DraftStatus
