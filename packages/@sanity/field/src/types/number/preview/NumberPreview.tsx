import React from 'react'
import {PreviewComponent} from '../../../preview/types'

import styles from './NumberPreview.css'

export const NumberPreview: PreviewComponent<string> = props => {
  const {value} = props

  return <span className={styles.root}>{value}</span>
}
