import EditIcon from 'part:@sanity/base/edit-icon'
import React from 'react'
import {Tooltip} from 'react-tippy'

import styles from './ItemStatus.css'

const DraftStatus = () => (
  <Tooltip
    className={styles.itemStatus}
    title="There are unpublished edits"
    arrow
    theme="light"
    distance="2"
    sticky
    size="small"
  >
    <div className={styles.draftBadge}>
      <EditIcon />
    </div>
  </Tooltip>
)

export default DraftStatus
