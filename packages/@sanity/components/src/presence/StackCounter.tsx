import React from 'react'
import styles from './StackCounter.css'

type Props = {
  count: number
  isGlobal?: boolean
  tone?: 'navbar'
}

export default function StackCounter({count, isGlobal = false, tone}: Props) {
  return (
    <div className={styles.root} data-tone={tone} key="counter">
      <div className={`${styles.counter} ${isGlobal ? styles.isGlobal : ''}`}>{count}</div>
    </div>
  )
}
