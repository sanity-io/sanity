import React from 'react'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import {Tooltip} from 'react-tippy'
import styles from './styles/ItemStatus.css'

const NotPublishedStatus = () => (
  <Tooltip
    className={styles.itemStatus}
    title="Not published"
    arrow
    theme="light"
    distance="2"
    sticky
    size="small"
  >
    <i>
      <VisibilityOffIcon />
    </i>
  </Tooltip>
)

export default NotPublishedStatus
