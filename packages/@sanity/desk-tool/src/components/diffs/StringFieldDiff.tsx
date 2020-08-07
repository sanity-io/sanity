/* eslint-disable react/no-multi-comp, react/prop-types */

import {useUserColorManager} from '@sanity/base'
import {StringDiffSegment, StringDiff} from '@sanity/diff'
import React from 'react'
import {Annotation} from '../../panes/documentPane/history/types'
import {getAnnotationColor} from './helpers'
import {DiffComponent} from './types'

import styles from './StringFieldDiff.css'

export function StringSegment({
  segment
}: {
  segment: StringDiffSegment<Annotation>
}): React.ReactElement {
  const userColorManager = useUserColorManager()

  if (segment.type === 'added') {
    const color = getAnnotationColor(userColorManager, segment.annotation)

    return (
      <ins className={styles.add} style={{background: color.bg, color: color.fg}}>
        {segment.text}
      </ins>
    )
  }

  if (segment.type === 'removed') {
    const color = getAnnotationColor(userColorManager, segment.annotation)

    return (
      <del className={styles.remove} style={{background: color.bg, color: color.fg}}>
        {segment.text}
      </del>
    )
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
