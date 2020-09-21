import * as React from 'react'
import {FromToIndex, Annotation, FieldChangeNode} from '../../types'
import {DiffCard} from './DiffCard'
import {DiffAnnotationCard} from './DiffAnnotationCard'

import styles from './ChangeTitleSegment.css'

export function ChangeTitleSegment({
  change,
  segment
}: {
  change?: FieldChangeNode
  segment: string | FromToIndex
}) {
  if (typeof segment === 'string') {
    return (
      <strong className={styles.text} title={segment}>
        {segment}
      </strong>
    )
  }

  const {hasMoved, fromIndex, toIndex, annotation} = segment
  const created = typeof fromIndex === 'undefined'
  const deleted = typeof toIndex === 'undefined'
  if (created) {
    // Item was created
    return <CreatedTitleSegment annotation={annotation} change={change} toIndex={toIndex} />
  }

  if (deleted) {
    // Item was deleted
    return <DeletedTitleSegment annotation={annotation} fromIndex={fromIndex} />
  }

  if (hasMoved && typeof toIndex !== 'undefined' && typeof fromIndex !== 'undefined') {
    // Item was moved
    return <MovedTitleSegment annotation={annotation} fromIndex={fromIndex} toIndex={toIndex} />
  }

  // Changed/unchanged
  const readableIndex = (toIndex || 0) + 1
  return <span className={styles.indexGroup}>#{readableIndex}</span>
}

function CreatedTitleSegment({
  annotation,
  change,
  toIndex = 0
}: {
  annotation: Annotation | undefined
  change?: FieldChangeNode
  toIndex?: number
}) {
  const readableIndex = toIndex + 1
  const description = `Added in position ${readableIndex}`
  const content = <>#{readableIndex}</>

  return (
    <DiffCard annotation={annotation || null} as="ins" description={description}>
      {change?.diff ? (
        <DiffAnnotationCard
          as="span"
          className={annotation ? styles.indexGroupWithAnnotation : styles.indexGroup}
          diff={change.diff}
        >
          {content}
        </DiffAnnotationCard>
      ) : (
        <span className={annotation ? styles.indexGroupWithAnnotation : styles.indexGroup}>
          {content}
        </span>
      )}
    </DiffCard>
  )
}

function DeletedTitleSegment({
  annotation,
  fromIndex = 0
}: {
  annotation: Annotation | undefined
  fromIndex?: number
}) {
  const readableIndex = fromIndex + 1
  const description = `Removed from position ${readableIndex}`
  return (
    <DiffCard
      annotation={annotation || null}
      className={annotation ? styles.indexGroupWithAnnotation : styles.indexGroup}
      as="del"
      description={description}
    >
      #{readableIndex}
    </DiffCard>
  )
}

function MovedTitleSegment({
  annotation,
  fromIndex,
  toIndex
}: {
  annotation: Annotation | undefined
  fromIndex: number
  toIndex: number
}) {
  const indexDiff = toIndex - fromIndex
  const indexSymbol = indexDiff < 0 ? '↑' : '↓'
  const description = `Moved ${Math.abs(indexDiff)} position ${indexDiff < 0 ? 'up' : 'down'}`
  return (
    <>
      <span className={styles.indexGroup}>#{toIndex + 1}</span>
      <DiffCard
        annotation={annotation || null}
        className={annotation ? styles.indexGroupWithAnnotation : styles.indexGroup}
        as="span"
        description={description}
      >
        {indexSymbol}
        {Math.abs(indexDiff)}
      </DiffCard>
    </>
  )
}
