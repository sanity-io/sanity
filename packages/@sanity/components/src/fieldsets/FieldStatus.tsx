import React from 'react'

import styles from './FieldStatus.css'

interface FieldStatusProps {
  children?: React.ReactNode
  maxAvatars?: number
  position?: 'top' | 'bottom'
}

export default function FieldStatus({children, maxAvatars, position = 'bottom'}: FieldStatusProps) {
  return (
    <div className={styles.root} data-max-avatars={maxAvatars} data-position={position}>
      {children}
    </div>
  )
}
