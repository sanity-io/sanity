import React from 'react'
import {DiffComponent, NumberDiff, DiffAnnotationTooltip, useDiffAnnotationColor} from '@sanity/field/diff'
import ArrowIcon from 'part:@sanity/base/arrow-right'
import styles from './NumberFieldDiff.css'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff}) => {
  const {fromValue, toValue} = diff
  const color = useDiffAnnotationColor(diff, [])
  const style =  color ? {background: color.background, color: color.text} : {}

  return (
    <DiffAnnotationTooltip className={styles.root} diff={diff}>
      {fromValue !== undefined && (
       <del className={`${styles.segment} ${styles.add}`} style={style}>{fromValue}</del>
      )}
      {fromValue && toValue &&
        <div className={styles.arrow}>
        <ArrowIcon />
      </div>
      }
      {toValue && <ins className={`${styles.segment} ${styles.remove}`} style={style}>{toValue}</ins>}
    </DiffAnnotationTooltip>
  )
}
