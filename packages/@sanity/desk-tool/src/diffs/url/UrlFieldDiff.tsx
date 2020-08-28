import React from 'react'
import {
  DiffComponent,
  // UrlDiff,
  DiffAnnotationTooltip,
  useDiffAnnotationColor
} from '@sanity/field/diff'
import styles from '../shared/BlockSegmentStyles.css'
import {DiffLayout} from '../shared'

// TODO add url diff type

export const UrlFieldDiff /* : DiffComponent<UrlDiff> */ = ({diff}) => {
  const {fromValue, toValue} = diff
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}

  return (
    <DiffAnnotationTooltip diff={diff}>
      <DiffLayout
        layout="grid"
        renderFrom={
          fromValue && (
            <del className={`${styles.segment} ${styles.add}`} style={style}>
              {fromValue}
            </del>
          )
        }
        renderTo={
          toValue && (
            <ins className={`${styles.segment} ${styles.remove}`} style={style}>
              {toValue}
            </ins>
          )
        }
      />
    </DiffAnnotationTooltip>
  )
}
