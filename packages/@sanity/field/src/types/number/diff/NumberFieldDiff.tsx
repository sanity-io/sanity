import React from 'react'
import {DiffComponent, DiffFromTo, NumberDiff} from '../../../diff'
import {NumberPreview} from '../preview/NumberPreview'

import styles from './NumberFieldDiff.css'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      cardClassName={styles.card}
      diff={diff}
      schemaType={schemaType}
      previewComponent={NumberPreview}
      layout="inline"
    />
  )
}
