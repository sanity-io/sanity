/* eslint-disable react/no-multi-comp, react/prop-types */

import {useUserColorManager} from '@sanity/base/user-color'
import {StringDiffSegment, StringDiff, DiffComponent} from '@sanity/field/diff'
import React from 'react'
import {AnnotationTooltip} from '../annotationTooltip'
import {getAnnotationColor} from '../helpers'

import styles from './StringFieldDiff.css'

export function StringSegment({segment}: {segment: StringDiffSegment}): React.ReactElement {
  const userColorManager = useUserColorManager()

  if (segment.type === 'added') {
    const color = getAnnotationColor(userColorManager, segment.annotation)

    return (
      <AnnotationTooltip annotation={segment.annotation}>
        <ins className={styles.add} style={{background: color.background, color: color.text}}>
          {segment.text}
        </ins>
      </AnnotationTooltip>
    )
  }

  if (segment.type === 'removed') {
    const color = getAnnotationColor(userColorManager, segment.annotation)

    return (
      <AnnotationTooltip annotation={segment.annotation}>
        <del className={styles.remove} style={{background: color.background, color: color.text}}>
          {segment.text}
        </del>
      </AnnotationTooltip>
    )
  }

  return <>{segment.text}</>
}

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff}) => {
  return (
    <div className={styles.root}>
      {(diff.segments || []).map((segment, idx) => (
        <StringSegment key={String(idx)} segment={segment} />
      ))}
    </div>
  )
}
