import React from 'react'
import {DiffComponent, StringDiff} from '../../types'
import {AnnotatedStringDiff, DiffAnnotationTooltip, useDiffAnnotationColor} from '../../annotations'
import styles from '../shared/BlockSegmentStyles.css'
import {DiffLayout} from '../shared'

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const {options} = schemaType
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  return (
    <div className={styles.root}>
      {options?.list ? (
        <DiffAnnotationTooltip className={styles.root} diff={diff}>
          <DiffLayout
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
      ) : (
        <AnnotatedStringDiff diff={diff} />
      )}
    </div>
  )
}
