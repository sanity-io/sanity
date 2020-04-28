import React from 'react'
import UsersIcon from 'part:@sanity/base/users-icon'
import useCollaborators from 'part:@sanity/base/hooks/collaborators'
import styles from './GlobalStatus.css'
import PopoverList from './PopoverList'
import AvatarProvider from './AvatarProvider'
import {MAX_AVATARS} from './constants'
import {splitRight} from './utils'

export default function GlobalStatus({projectId}: {projectId?: string}) {
  const users = useCollaborators()
  const [hiddenUsers, visibleUsers] = splitRight(users)
  return (
    <div className={styles.root} tabIndex={0}>
      <PopoverList
        trigger="click"
        userList={users}
        withStack={hiddenUsers.length >= MAX_AVATARS - 1 || users.length === 0}
        hiddenCount={hiddenUsers.length}
        avatarSize="medium"
        isGlobal
        projectId={projectId}
      >
        {/* Only show this on mobile */}
        <button
          className={styles.mobileButton}
          title="Show online users"
          type="button"
          tabIndex={-1}
        >
          <div className={styles.icon}>
            {users.length > 0 && (
              <div className={styles.statusIndicator} aria-label={`Online collaborators`} />
            )}
            <UsersIcon />
          </div>
        </button>
        {/* Show avatars laid out like on a field */}
        <button
          className={styles.avatarsButton}
          aria-label="Show online users"
          type="button"
          tabIndex={-1}
        >
          <div className={styles.avatars}>
            {visibleUsers.map(user => (
              <div className={styles.avatarOverlap} key={user.identity}>
                <AvatarProvider userId={user.identity} showFill={false} />
              </div>
            ))}
          </div>
        </button>
      </PopoverList>
    </div>
  )
}
