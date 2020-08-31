import React from 'react'
import {useDiffAnnotationColor, DiffAnnotationTooltip} from '../../annotations'
import {DiffComponent, ObjectDiff} from '../../types'
import {DiffLayout} from '../shared'
import styles from '../shared/BlockSegmentStyles.css'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({diff}) => {
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
              {fromValue.current}
            </del>
          )
        }
        renderTo={
          toValue && (
            <ins className={`${styles.segment} ${styles.remove}`} style={style}>
              {toValue.current}
            </ins>
          )
        }
      />
    </DiffAnnotationTooltip>
  )
}
