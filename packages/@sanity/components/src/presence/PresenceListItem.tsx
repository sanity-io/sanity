import React from 'react'
import LinkIcon from 'part:@sanity/base/link-icon'
import {AvatarSize} from '../avatar'
import styles from './PresenceListItem.css'
import UserAvatar from './UserAvatar'
import {Status, User} from './types'

type Props = {
  user: User
  status: Status
  size?: AvatarSize
  hasLink?: string | undefined
}

export function PresenceListItem({user, status, size, hasLink}: Props) {
  return (
    <div className={styles.root} data-size={size}>
      <div className={styles.avatar}>
        <UserAvatar user={user} size={size} status={status} />
      </div>
      <div className={styles.inner}>
        <div className={styles.userName}>{user.displayName}</div>
      </div>
      {hasLink && (
        <div className={styles.linkIcon}>
          <LinkIcon />
        </div>
      )}
    </div>
  )
}
