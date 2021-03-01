import React from 'react'
import {DiffComponent, DiffFromTo, StringDiff} from '../../../diff'
import {DatetimePreview} from '../preview'

import styles from './DatetimeFieldDiff.css'

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      align="center"
      cardClassName={styles.card}
      diff={diff}
      schemaType={schemaType}
      previewComponent={DatetimePreview}
    />
  )
}
