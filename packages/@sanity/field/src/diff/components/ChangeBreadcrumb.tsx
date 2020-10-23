import React, {Fragment} from 'react'
import {ChangeTitlePath, FieldChangeNode} from '../../types'
import {ChangeTitleSegment} from './ChangeTitleSegment'

import styles from './ChangeBreadcrumb.css'

export function ChangeBreadcrumb({
  change,
  titlePath,
}: {
  change?: FieldChangeNode
  titlePath: ChangeTitlePath
}): React.ReactElement {
  return (
    <div className={styles.crumb}>
      {titlePath.map((titleSegment, idx) => {
        const showSegment = typeof titleSegment === 'string' || !change || change.showIndex
        if (!showSegment) {
          return null
        }

        return (
          <Fragment key={idx}>
            {idx > 0 && <em className={styles.change__breadcrumb__separator}> / </em>}
            <ChangeTitleSegment change={change} segment={titleSegment} />
          </Fragment>
        )
      })}
    </div>
  )
}
