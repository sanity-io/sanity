import React from 'react'
import styles from '../shared/BlockSegmentStyles.css'
import {DiffLayout} from '../shared'
import {useDiffAnnotationColor, DiffAnnotationTooltip} from '../../annotations'

// @todo TODO slug diff type

export const SlugFieldDiff /* : DiffComponent<StringDiff> */ = ({diff}) => {
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
