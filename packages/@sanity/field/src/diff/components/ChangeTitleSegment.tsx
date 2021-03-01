import * as React from 'react'
import {FromToIndex, Annotation, FieldChangeNode} from '../../types'
import {getAnnotationAtPath} from '../annotations'
import {DiffCard} from './DiffCard'

import styles from './ChangeTitleSegment.css'

export function ChangeTitleSegment({
  change,
  segment,
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
  annotation: annotationProp,
  change,
  toIndex = 0,
}: {
  annotation: Annotation | undefined
  change?: FieldChangeNode
  toIndex?: number
}) {
  const readableIndex = toIndex + 1
  const description = `Added in position ${readableIndex}`
  const content = <>#{readableIndex}</>
  const diffAnnotation = change?.diff ? getAnnotationAtPath(change.diff, []) : undefined
  const annotation = diffAnnotation || annotationProp

  if (annotation) {
    return (
      <DiffCard
        annotation={annotation}
        as="ins"
        className={styles.indexGroup}
        tooltip={{description}}
      >
        {content}
      </DiffCard>
    )
  }

  return <span className={styles.indexGroup}>{content}</span>
}

function DeletedTitleSegment({
  annotation,
  fromIndex = 0,
}: {
  annotation: Annotation | undefined
  fromIndex?: number
}) {
  const readableIndex = fromIndex + 1
  const description = `Removed from position ${readableIndex}`
  return (
    <DiffCard
      annotation={annotation || null}
      className={styles.indexGroup}
      as="del"
      tooltip={{description}}
    >
      #{readableIndex}
    </DiffCard>
  )
}

function MovedTitleSegment({
  annotation,
  fromIndex,
  toIndex,
}: {
  annotation: Annotation | undefined
  fromIndex: number
  toIndex: number
}) {
  const indexDiff = toIndex - fromIndex
  const indexSymbol = indexDiff < 0 ? '↑' : '↓'
  const positions = Math.abs(indexDiff)
  const description = `Moved ${positions} position${positions === 1 ? '' : 's'} ${
    indexDiff < 0 ? 'up' : 'down'
  }`

  return (
    <>
      <span className={styles.indexGroup}>#{toIndex + 1}</span>
      <DiffCard
        annotation={annotation}
        className={styles.indexGroup}
        as="span"
        tooltip={{description}}
      >
        {indexSymbol}
        {Math.abs(indexDiff)}
      </DiffCard>
    </>
  )
}
