import * as React from 'react'
import {FromToIndex} from '../types'
import styles from './ChangeTitleSegment.css'

export function ChangeTitleSegment({segment}: {segment: string | FromToIndex}) {
  if (typeof segment === 'string') {
    return (
      <strong className={styles.text} title={segment}>
        {segment}
      </strong>
    )
  }

  const {hasMoved, fromIndex, toIndex} = segment
  return (
    <span className={styles.indexGroup}>
      {hasMoved && <span className={styles.index}>{fromIndex}</span>}
      {hasMoved && ' → '}
      <span className={styles.index}>{toIndex}</span>
    </span>
  )
}
