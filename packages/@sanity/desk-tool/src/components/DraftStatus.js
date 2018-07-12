import React from 'react'
import EditIcon from 'part:@sanity/base/edit-icon'
import {Tooltip} from '@sanity/react-tippy'
import styles from './styles/ItemStatus.css'

const DraftStatus = () => (
  <div className={styles.itemStatus}>
    <Tooltip
      title="Has changes not yet published"
      arrow
      theme="light"
      distance="2"
      sticky
      size="small"
    >
      <i>
        <EditIcon />
      </i>
    </Tooltip>
  </div>
)

export default DraftStatus
