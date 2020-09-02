import React from 'react'
import {DiffAnnotationCard, DiffAnnotationTooltip} from '../../annotations'
import {DiffComponent, ObjectDiff} from '../../types'
import {DiffLayout} from '../shared'
import styles from '../shared/BlockSegmentStyles.css'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({diff}) => {
  const {fromValue, toValue} = diff

  return (
    <DiffAnnotationTooltip diff={diff}>
      <DiffLayout
        layout="grid"
        renderFrom={
          fromValue && (
            <DiffAnnotationCard as="del" className={`${styles.segment} ${styles.add}`} diff={diff}>
              {fromValue.current}
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
              {toValue.current}
            </DiffAnnotationCard>
          )
        }
      />
    </DiffAnnotationTooltip>
  )
}
