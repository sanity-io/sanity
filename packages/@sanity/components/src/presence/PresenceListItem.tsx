import styles from './PresenceListItem.css'
import UserAvatar from './UserAvatar'
import React from 'react'
import {Size, Status, User} from './types'

type Props = {
  user: User
  status: Status
  size?: Size
  onClick?: () => void
}

export function PresenceListItem({user, status, size, onClick}: Props) {
  return (
    <div className={styles.inner} data-size={size} onClick={onClick}>
      <div className={styles.avatar}>
        <UserAvatar user={user} size={size} status={status} />
      </div>
      <div className={styles.userInfo}>
        <span className={styles.name} title={user.displayName}>
          {user.displayName}
        </span>
      </div>
    </div>
  )
}
