/* eslint-disable react/no-multi-comp */
import React from 'react'
import UsersIcon from 'part:@sanity/base/users-icon'
import styles from './GlobalStatus.css'
import PopoverList from './PopoverList'
import {MAX_AVATARS} from './constants'
import {splitRight} from './utils'
import StackCounter from './StackCounter'
import {GlobalPresence, Size} from './types'
import UserAvatar from './UserAvatar'
import {IntentLink} from 'part:@sanity/base/router'
import {PresenceListItem} from './PresenceListItem'

interface Props {
  projectId: string
  presence: GlobalPresence[]
}

type GlobalPresenceListItemProps = {
  presence: GlobalPresence
  size?: Size
  onClick?: () => void
}

function GlobalPresenceListItem(props: GlobalPresenceListItemProps) {
  const {presence, onClick, size} = props
  const documentId = presence.locations.map(location => location.documentId)
  const item = (
    <PresenceListItem user={presence.user} status={presence.status} onClick={onClick} size={size} />
  )
  return documentId ? (
    <IntentLink className={styles.intentLink} intent="edit" params={{id: documentId}}>
      {item}
    </IntentLink>
  ) : (
    item
  )
}

export function GlobalStatus({projectId, presence}: Props) {
  const [hiddenUsers, visibleUsers] = splitRight(presence, MAX_AVATARS)
  const showCounter = hiddenUsers.length >= MAX_AVATARS - 1 || presence.length === 0
  return (
    <div className={styles.root}>
      <PopoverList
        items={presence}
        renderItem={item => <GlobalPresenceListItem presence={item} />}
        isGlobal
        projectId={projectId}
        trigger="click"
      >
        <div className={styles.inner} tabIndex={-1}>
          {/* Only show this on mobile */}
          <div className={styles.mobileContent}>
            <div className={styles.icon}>
              {presence.length > 0 && (
                <div className={styles.statusIndicator} aria-label={`Online presentUsers`} />
              )}
              <UsersIcon />
            </div>
          </div>
          {/* Show avatars laid out like on a field */}
          <div className={styles.avatars}>
            {showCounter && <StackCounter count={hiddenUsers.length} />}
            {visibleUsers.map(presentUser => (
              <div className={styles.avatarOverlap} key={presentUser.user.id}>
                <UserAvatar user={presentUser.user} fillColor="currentColor" color="#ea5fb1" />
              </div>
            ))}
          </div>
        </div>
      </PopoverList>
    </div>
  )
}
