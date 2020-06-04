/* eslint-disable react/no-multi-comp */
import React from 'react'
import UsersIcon from 'part:@sanity/base/users-icon'
import styles from './GlobalStatus.css'
import PopoverList from './PopoverList'
import {splitRight} from './utils'
import StackCounter from './StackCounter'
import {GlobalPresence} from './types'
import UserAvatar from './UserAvatar'
import {PresenceListItem} from './PresenceListItem'
import {MAX_AVATARS_GLOBAL} from './constants'

interface Props {
  projectId: string
  maxAvatars: number
  presence: GlobalPresence[]
}

export function GlobalStatus({projectId, presence, maxAvatars = MAX_AVATARS_GLOBAL}: Props) {
  const [hiddenUsers, visibleUsers] = splitRight(presence, maxAvatars)
  const showCounter = hiddenUsers.length >= maxAvatars - 1 || presence.length === 0
  return (
    <div className={styles.root}>
      <PopoverList
        items={presence}
        renderItem={(item, onClose) => (
          <PresenceListItem
            user={item.user}
            status={item.status}
            locations={item.locations}
            size="medium"
            onClose={onClose}
          />
        )}
        isGlobal
        projectId={projectId}
        trigger="click"
      >
        <div className={styles.inner} tabIndex={-1}>
          {/* Only show this on mobile */}
          <div className={styles.mobileContent}>
            <div className={styles.icon}>
              {presence.length > 0 && <div className={styles.statusIndicator} />}
              <UsersIcon />
            </div>
          </div>
          {/* Show avatars laid out like on a field */}
          <div className={styles.avatars}>
            {showCounter && <StackCounter count={hiddenUsers.length} tone="navbar" />}
            {visibleUsers.map(presentUser => (
              <div className={styles.avatarOverlap} key={presentUser.user.id}>
                <UserAvatar user={presentUser.user} tone="navbar" />
              </div>
            ))}
          </div>
        </div>
      </PopoverList>
    </div>
  )
}
