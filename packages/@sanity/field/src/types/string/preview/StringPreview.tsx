import React from 'react'
import {PreviewComponent} from '../../../preview/types'

import styles from './StringPreview.css'

export const StringPreview: PreviewComponent<string> = props => {
  const {value} = props

  return <span className={styles.root}>{value}</span>
}
