import React from 'react'

import styles from './FieldStatus.css'

interface FieldStatusProps {
  children?: React.ReactNode
  position?: 'top' | 'bottom'
}

export default function FieldStatus({position = 'bottom', children}: FieldStatusProps) {
  return (
    <div className={styles.root} data-position={position}>
      {children}
    </div>
  )
}
