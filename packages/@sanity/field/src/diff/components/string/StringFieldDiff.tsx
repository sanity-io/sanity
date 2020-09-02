import React from 'react'
import {DiffComponent, StringDiff} from '../../types'
import {AnnotatedStringDiff, DiffAnnotationCard, DiffAnnotationTooltip} from '../../annotations'
import styles from '../shared/BlockSegmentStyles.css'
import {DiffLayout} from '../shared'

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  const {fromValue, toValue} = diff
  const {options} = schemaType

  return (
    <div className={styles.root}>
      {options?.list ? (
        <DiffAnnotationTooltip className={styles.root} diff={diff}>
          <DiffLayout
            renderFrom={
              fromValue && (
                <DiffAnnotationCard
                  as="del"
                  className={`${styles.segment} ${styles.add}`}
                  diff={diff}
                >
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
      ) : (
        <AnnotatedStringDiff diff={diff} />
      )}
    </div>
  )
}
