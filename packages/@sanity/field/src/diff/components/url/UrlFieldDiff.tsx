import React from 'react'
import {StringDiff, DiffComponent} from '../../types'
import {DiffAnnotationCard, DiffAnnotationTooltip} from '../../annotations'
import {DiffLayout} from '../shared'
import styles from '../shared/BlockSegmentStyles.css'

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff}) => {
  const {fromValue, toValue} = diff

  return (
    <DiffAnnotationTooltip diff={diff}>
      <DiffLayout
        layout="grid"
        renderFrom={
          fromValue && (
            <DiffAnnotationCard as="del" className={`${styles.segment} ${styles.add}`} diff={diff}>
              {fromValue}
            </DiffAnnotationCard>
          )
        }
        renderTo={
          toValue && (
            <DiffAnnotationCard
              as="ins"
              className={`${styles.segment} ${styles.remove}`}
              diff={diff}
            >
              {toValue}
            </DiffAnnotationCard>
          )
        }
      />
    </DiffAnnotationTooltip>
  )
}
