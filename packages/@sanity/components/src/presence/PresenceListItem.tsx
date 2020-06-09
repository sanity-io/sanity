import styles from './PresenceListItem.css'
import UserAvatar from './UserAvatar'
import React from 'react'
import {Size, Status, User, Location} from './types'
import LinkIcon from 'part:@sanity/base/link-icon'
import {IntentLink} from 'part:@sanity/base/router'

type Props = {
  user: User
  status: Status
  size?: Size
  locations?: Location[]
  hasLink?: string | undefined
}

export function PresenceListItem({user, status, size, locations = [], hasLink}: Props) {
  const locationWithDocumentId = locations.find(location => location.documentId)
  return (
    <div className={styles.root} data-size={size}>
      <div className={styles.avatar}>
        <UserAvatar user={user} size={size} status={status} />
      </div>
      <div className={styles.inner}>
        <div className={styles.userName}>{user.displayName}</div>
      </div>
      {hasLink && <div className={styles.linkIcon}><LinkIcon /></div>}
    </div>
  )
}
