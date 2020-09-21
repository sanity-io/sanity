import React from 'react'
import {PreviewComponent} from '../../../preview/types'
import {Slug} from '../types'

import styles from './SlugPreview.css'

export const SlugPreview: PreviewComponent<Slug> = props => {
  const {value} = props

  return <span className={styles.root}>{value.current}</span>
}
