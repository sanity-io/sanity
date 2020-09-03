import React, {Fragment} from 'react'
import {ChangeTitlePath} from '../../types'
import {ChangeTitleSegment} from './ChangeTitleSegment'
import styles from './ChangeBreadcrumb.css'

export function ChangeBreadcrumb({titlePath}: {titlePath: ChangeTitlePath}) {
  return (
    <div className={styles.crumb}>
      {titlePath.map((titleSegment, idx) => (
        <Fragment key={idx}>
          {idx > 0 && typeof titleSegment === 'string' && (
            <em className={styles.change__breadcrumb__separator}> / </em>
          )}
          <ChangeTitleSegment segment={titleSegment} />
        </Fragment>
      ))}
    </div>
  )
}
