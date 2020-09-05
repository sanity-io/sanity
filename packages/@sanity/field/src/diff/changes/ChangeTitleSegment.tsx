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
    const description = `Added in position ${(toIndex || 0) + 1} by`
    return (
      <DiffAnnotation
        annotation={annotation || null}
        className={styles.indexGroup}
        as="ins"
        description={description}
      >
        #{toIndex}
      </DiffAnnotation>
    )
  }

  if (deleted) {
    const description = `Removed from position ${(fromIndex || 0) + 1} by`
    return (
      <DiffAnnotation
        annotation={annotation || null}
        className={styles.indexGroup}
        as="del"
        description={description}
      >
        #{fromIndex}
      </DiffAnnotation>
    )
  }

  if (hasMoved && typeof toIndex !== 'undefined' && typeof fromIndex !== 'undefined') {
    const indexDiff = toIndex - fromIndex
    const indexSymbol = indexDiff < 0 ? '↑' : '↓'
    const description = `Moved ${Math.abs(indexDiff)} position ${indexDiff < 0 ? 'up' : 'down'} by`
    return (
      <>
        <span className={styles.indexGroup}>#{toIndex}</span>
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

  return <span className={styles.indexGroup}>#{toIndex}</span>
}
