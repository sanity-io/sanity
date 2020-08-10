/* eslint-disable react/no-multi-comp, react/prop-types */

import {useUserColorManager} from '@sanity/base'
import {StringDiffSegment, StringDiff} from '@sanity/diff'
import React from 'react'
import {Annotation} from '../../panes/documentPane/history/types'
import {AnnotationTooltip} from './annotationTooltip'
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
    if (!segment.annotation) {
      console.error('@todo: why are we missing annotation for added string segment?')
    }

    const color = segment.annotation
      ? getAnnotationColor(userColorManager, segment.annotation)
      : {bg: '#fcc', fg: '#f00'}

    return (
      <AnnotationTooltip annotation={segment.annotation}>
        <ins className={styles.add} style={{background: color.bg, color: color.fg}}>
          {segment.text}
        </ins>
      </AnnotationTooltip>
    )
  }

  if (segment.type === 'removed') {
    if (!segment.annotation) {
      console.error('@todo: why are we missing annotation for added string segment?')
    }

    const color = segment.annotation
      ? getAnnotationColor(userColorManager, segment.annotation)
      : {bg: '#fcc', fg: '#f00'}

    return (
      <AnnotationTooltip annotation={segment.annotation}>
        <del className={styles.remove} style={{background: color.bg, color: color.fg}}>
          {segment.text}
        </del>
      </AnnotationTooltip>
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
