import React from 'react'
import {DiffComponent, DiffFromTo, StringDiff} from '../../../diff'
import {StringPreview} from '../../string/preview'

import styles from './UrlFieldDiff.css'

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      cardClassName={styles.card}
      diff={diff}
      schemaType={schemaType}
      previewComponent={StringPreview}
    />
  )
}
