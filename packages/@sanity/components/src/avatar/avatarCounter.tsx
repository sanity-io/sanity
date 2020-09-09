import React from 'react'
import {AvatarSize} from './types'

import styles from './avatarCounter.css'

interface AvatarCounterProps {
  count: number
  // isGlobal?: boolean
  size?: AvatarSize
  tone?: 'navbar'
}

export function AvatarCounter({count, size = 'small', tone}: AvatarCounterProps) {
  return (
    <div className={styles.root} data-size={size} data-tone={tone}>
      <span>{count}</span>
    </div>
  )
}
