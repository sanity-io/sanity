import React from 'react'
import {StringDiff, DiffComponent, AnnotatedStringDiff} from '@sanity/field/diff'
import styles from './StringFieldDiff.css'

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff}) => {
  return (
    <div className={styles.root}>
      <AnnotatedStringDiff diff={diff} />
    </div>
  )
}
