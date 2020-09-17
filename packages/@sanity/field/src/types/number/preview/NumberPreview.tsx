import React from 'react'
import {PreviewComponent} from '../../../preview/types'

import styles from './NumberPreview.css'

export const NumberPreview: PreviewComponent<string> = props => {
  const {color, value} = props

  return (
    <span className={styles.root} style={{background: color?.background, color: color?.text}}>
      {value}
    </span>
  )
}
