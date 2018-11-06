import React from 'react'
import EditIcon from 'part:@sanity/base/edit-icon'
import {Tooltip} from 'react-tippy'
import styles from './styles/ItemStatus.css'

const DraftStatus = () => (
  <Tooltip
    className={styles.itemStatus}
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
)

export default DraftStatus
