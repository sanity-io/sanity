import * as React from 'react'
import {NumberDiff, StringDiffSegment} from '@sanity/diff'
import {Annotation} from '../../panes/documentPane/history/types'
import {DiffComponent} from './types'
import {StringSegment} from './StringFieldDiff'

import styles from './NumberFieldDiff.css'

export const NumberFieldDiff: DiffComponent<NumberDiff<Annotation>> = ({diff}) => {
  const {fromValue, toValue, annotation} = diff
  const segments: StringDiffSegment[] = []

  if (typeof fromValue === 'number') {
    segments.push({type: 'removed', text: fromValue.toString(), annotation})
  }
  if (typeof toValue === 'number') {
    segments.push({type: 'added', text: fromValue.toString(), annotation})
  }

  return (
    <div className={styles.root}>
      {segments.map((segment, index) => (
        <StringSegment key={index} segment={segment} />
      ))}
    </div>
  )
}
