/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-filename-extension */

import React from 'react'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import {Tooltip} from 'react-tippy'
import styles from './ItemStatus.css'

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
