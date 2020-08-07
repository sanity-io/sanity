/* eslint-disable react/no-multi-comp, react/prop-types */

import * as React from 'react'
import {StringDiffSegment, StringDiff} from '@sanity/diff'
import {Annotation} from '../../panes/documentPane/history/types'
import {DiffComponent} from './types'

import styles from './StringFieldDiff.css'

export function StringSegment({
  segment
}: {
  segment: StringDiffSegment<Annotation>
}): React.ReactElement {
  if (segment.type === 'added') {
    return <ins className={styles.add}>{segment.text}</ins>
  }

  if (segment.type === 'removed') {
    return <del className={styles.remove}>{segment.text}</del>
  }

  return <>{segment.text}</>
}

export const StringFieldDiff: DiffComponent<StringDiff<Annotation>> = ({diff}) => {
  return (
    <div className={styles.root}>
      {(diff.segments || []).map((segment, idx) => (
        <StringSegment key={String(idx)} segment={segment} />
      ))}
    </div>
  )
}
