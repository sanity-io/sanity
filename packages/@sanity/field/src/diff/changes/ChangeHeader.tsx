import React from 'react'
import {ChangeTitlePath} from '../types'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import styles from './ChangeHeader.css'

export function ChangeHeader({titlePath}: {titlePath: ChangeTitlePath}) {
  return (
    <div className={styles.root}>
      <ChangeBreadcrumb titlePath={titlePath} />
    </div>
  )
}
