import React from 'react'
import {DiffAnnotationCard, DiffAnnotationTooltip} from '../../annotations'
import {DiffComponent, NumberDiff} from '../../types'
import {DiffLayout} from '../shared'
import styles from '../shared/BlockSegmentStyles.css'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff}) => {
  const {fromValue, toValue} = diff

  return (
    <DiffAnnotationTooltip className={styles.root} diff={diff}>
      <DiffLayout
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
