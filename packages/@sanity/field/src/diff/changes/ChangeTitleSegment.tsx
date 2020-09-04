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
    return (
      <DiffAnnotation annotation={annotation || null} className={styles.indexGroup} as="ins">
        #{toIndex}
      </DiffAnnotation>
    )
  }

  if (deleted) {
    return (
      <DiffAnnotation annotation={annotation || null} className={styles.indexGroup} as="del">
        #{fromIndex}
      </DiffAnnotation>
    )
  }

  if (hasMoved && typeof toIndex !== 'undefined' && typeof fromIndex !== 'undefined') {
    const indexDiff = toIndex - fromIndex
    const indexSymbol = indexDiff < 0 ? '↑' : '↓'
    return (
      <>
        <span className={styles.indexGroup}>#{toIndex}</span>
        <DiffAnnotation annotation={annotation || null} className={styles.indexGroup} as="span">
          {indexSymbol}
          {Math.abs(indexDiff)}
        </DiffAnnotation>
      </>
    )
  }

  return <span className={styles.indexGroup}>#{toIndex}</span>
}
