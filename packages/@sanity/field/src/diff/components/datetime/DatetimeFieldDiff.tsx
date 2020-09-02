import React from 'react'
import {DiffComponent, StringDiff} from '../../types'
import {DiffAnnotationCard, DiffAnnotationTooltip} from '../../annotations'
import {DiffLayout} from '../shared'
import {getDateFormat} from './helpers'

import styles from '../shared/BlockSegmentStyles.css'

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const fromDate = fromValue && getDateFormat(fromValue, schemaType.name, schemaType.options)
  const toDate = toValue && getDateFormat(toValue, schemaType.name, schemaType.options)

  return (
    <DiffAnnotationTooltip className={styles.root} diff={diff}>
      <DiffLayout
        renderFrom={
          fromValue !== undefined && (
            <DiffAnnotationCard as="del" className={`${styles.segment} ${styles.add}`} diff={diff}>
              {fromDate}
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
              {toDate}
            </DiffAnnotationCard>
          )
        }
      />
    </DiffAnnotationTooltip>
  )
}
