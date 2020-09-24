import React from 'react'
import styles from './Blockquote.css'

export default function Blockquote({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <div className={styles.root}>
      <blockquote className={styles.quote}>{children}</blockquote>
    </div>
  )
}
