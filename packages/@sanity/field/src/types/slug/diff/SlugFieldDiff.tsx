import React from 'react'
import {DiffComponent, DiffFromTo, ObjectDiff} from '../../../diff'
import {SlugPreview} from '../preview'

import styles from './SlugFieldDiff.css'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      cardClassName={styles.card}
      layout="inline"
      diff={diff}
      schemaType={schemaType}
      previewComponent={SlugPreview}
    />
  )
}
