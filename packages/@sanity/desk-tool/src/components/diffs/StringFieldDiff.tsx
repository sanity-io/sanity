/* eslint-disable react/no-multi-comp, react/prop-types */
import * as React from 'react'
import {StringDiffSegment, StringDiff} from '@sanity/diff'
import {Annotation} from '../../panes/documentPane/history/types'
import {DiffComponent} from './types'
import {FieldDiffContainer} from './FieldDiffContainer'
import styles from './StringFieldDiff.css'

function StringSegment({segment}: {segment: StringDiffSegment<Annotation>}): React.ReactElement {
  if (segment.type === 'added') {
    return <span className={styles.add}>{segment.text}</span>
  }

  if (segment.type === 'removed') {
    return <span className={styles.remove}>{segment.text}</span>
  }

  return <span>{segment.text}</span>
}

export const StringFieldDiff: DiffComponent<StringDiff<Annotation>> = props => {
  return (
    <FieldDiffContainer>
      {(props.segments || []).map((segment, idx) => (
        <StringSegment key={String(idx)} segment={segment} />
      ))}
    </FieldDiffContainer>
  )
}
