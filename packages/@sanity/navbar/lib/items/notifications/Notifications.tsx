import * as React from 'react'
import BellIcon from 'part:@sanity/base/bell-icon'

import * as styles from './Notifications.module.css'

function Notifications() {
  return (
    <div className={styles.root}>
      <BellIcon />
    </div>
  )
}

export default Notifications
