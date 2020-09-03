import * as React from 'react'
import {GroupChangeNode} from '../../types'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'

import styles from './GroupChange.css'

export function GroupChange({change: group}: {change: GroupChangeNode}) {
  const {titlePath, changes} = group
  return (
    <div className={styles.groupChange}>
      <div className={styles.changeHeader}>
        <ChangeBreadcrumb titlePath={titlePath} />
      </div>

      <div className={styles.changeList}>
        {changes.map(change => (
          <ChangeResolver key={change.key} change={change} />
        ))}
      </div>
    </div>
  )
}
