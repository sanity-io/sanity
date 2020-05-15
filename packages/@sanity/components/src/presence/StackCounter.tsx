import React from 'react'
import styles from './StackCounter.css'

type Props = {
  count: number
  isGlobal?: boolean
}

export default function StackCounter({count, isGlobal = false}: Props) {
  return (
    <div className={styles.root} key="counter">
      <div className={`${styles.counter} ${isGlobal ? styles.isGlobal : ''}`}>{count}</div>
    </div>
  )
}
