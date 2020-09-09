import React from 'react'
import styles from './FieldStatus.css'
export default function FieldStatus({position = 'bottom', children}) {
  return (
    <div className={styles.root} data-position={position}>
      {children}
    </div>
  )
}
