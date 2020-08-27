import React from 'react'
import {DiffComponent, StringDiff} from '../../types'
import {AnnotatedStringDiff} from '../../annotations'
import styles from './StringFieldDiff.css'

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff}) => {
  return (
    <div className={styles.root}>
      <AnnotatedStringDiff diff={diff} />
    </div>
  )
}
