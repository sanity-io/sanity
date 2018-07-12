import React from 'react'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import {Tooltip} from '@sanity/react-tippy'
import styles from './styles/ItemStatus.css'

const NotPublishedStatus = () => (
  <div className={styles.itemStatus}>
    <Tooltip title="Not published" arrow theme="light" distance="2" sticky size="small">
      <i>
        <VisibilityOffIcon />
      </i>
    </Tooltip>
  </div>
)

export default NotPublishedStatus
