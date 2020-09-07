import * as React from 'react'
import {FromToIndex} from '../../types'
import {DiffAnnotation} from '../annotations'
import styles from './ChangeTitleSegment.css'

export function ChangeTitleSegment({segment}: {segment: string | FromToIndex}) {
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
    const readableIndex = (toIndex || 0) + 1
    const description = `Added in position ${readableIndex} by`
    return (
      <DiffAnnotation
        annotation={annotation || null}
        className={styles.indexGroup}
        as="ins"
        description={description}
      >
        #{readableIndex}
      </DiffAnnotation>
    )
  }

  if (deleted) {
    // Item was deleted
    const readableIndex = (fromIndex || 0) + 1
    const description = `Removed from position ${readableIndex} by`
    return (
      <DiffAnnotation
        annotation={annotation || null}
        className={styles.indexGroup}
        as="del"
        description={description}
      >
        #{readableIndex}
      </DiffAnnotation>
    )
  }

  if (hasMoved && typeof toIndex !== 'undefined' && typeof fromIndex !== 'undefined') {
    // Item was moved
    const indexDiff = toIndex - fromIndex
    const indexSymbol = indexDiff < 0 ? '↑' : '↓'
    const description = `Moved ${Math.abs(indexDiff)} position ${indexDiff < 0 ? 'up' : 'down'} by`
    return (
      <>
        <span className={styles.indexGroup}>#{toIndex + 1}</span>
        <DiffAnnotation
          annotation={annotation || null}
          className={styles.indexGroup}
          as="span"
          description={description}
        >
          {indexSymbol}
          {Math.abs(indexDiff)}
        </DiffAnnotation>
      </>
    )
  }

  // Changed/unchanged
  const readableIndex = (toIndex || 0) + 1
  return <span className={styles.indexGroup}>#{readableIndex}</span>
}
