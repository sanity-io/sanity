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
  onClick?: () => void
  locations?: Location[]
  onClose?: (event: any) => void
}

export function PresenceListItem({user, status, size, onClick, locations = [], onClose}: Props) {
  const locationWithDocumentId = locations.find(location => location.documentId)
  return (
    <div className={styles.root} data-size={size} onClick={onClick}>
      <div className={styles.avatar}>
        <UserAvatar user={user} size={size} status={status} />
      </div>
      <div className={styles.inner}>
        <div className={styles.userName}>{user.displayName}</div>
      </div>
      {locationWithDocumentId && (
        <IntentLink
          className={styles.intentLink}
          title={`Go to ${user.displayName}`}
          intent="edit"
          params={{id: locationWithDocumentId.documentId}}
          onClick={onClose}
        >
          <LinkIcon />
        </IntentLink>
      )}
    </div>
  )
}
