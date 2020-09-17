import React from 'react'
import {PreviewComponent} from '../../../preview/types'
import {Slug} from '../types'

import styles from './SlugPreview.css'

export const SlugPreview: PreviewComponent<Slug> = props => {
  const {color, value} = props

  return (
    <span className={styles.root} style={{background: color?.background, color: color?.text}}>
      {value.current}
    </span>
  )
}
