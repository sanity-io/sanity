import React from 'react'
import {DiffComponent, DiffFromTo, DiffString, StringDiff} from '../../../diff'
import {StringPreview} from '../preview/StringPreview'

import styles from './StringFieldDiff.css'

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  const {options} = schemaType as any

  if (options?.list) {
    // When the string is considered to be an "enum", don't show individual
    // string segment changes, rather treat is as a "from -> to" diff
    return (
      <DiffFromTo
        cardClassName={styles.card}
        diff={diff}
        previewComponent={StringPreview}
        schemaType={schemaType}
      />
    )
  }

  return (
    <div className={styles.root}>
      <DiffString diff={diff} />
    </div>
  )
}
