import React from 'react'
import UsersIcon from 'part:@sanity/base/users-icon'
import useCollaborators from 'part:@sanity/base/hooks/collaborators'
import styles from './GlobalStatus.css'
import PopoverList from './PopoverList'
import AvatarProvider from './AvatarProvider'
import {MAX_AVATARS} from './constants'
import {splitRight} from './utils'

export default function GlobalStatus() {
  const users = useCollaborators()
  const [hiddenUsers, visibleUsers] = splitRight(users)
  return (
    <div className={styles.root}>
      <PopoverList
        trigger="click"
        disabled={hiddenUsers.length <= 1}
        userList={users}
        withStack={hiddenUsers.length >= MAX_AVATARS - 1}
        hiddenCount={hiddenUsers.length}
        avatarSize="medium"
      >
        {/* Only show this on mobile */}
        <button className={styles.mobileButton} title="Show online users" type="button">
          <div className={styles.icon}>
            {users.length > 0 && (
              <div className={styles.statusIndicator} aria-label={`Online collaborators`} />
            )}
            <UsersIcon />
          </div>
        </button>
        {/* Show avatars laid out like on a field, with stack when needed */}
        <div className={styles.avatarView}>
          <div className={styles.avatars}>
            {visibleUsers.map(user => (
              <div key={user.identity} style={{display: 'flex', marginLeft: '-8px'}}>
                <AvatarProvider userId={user.identity} showFill={false} />
              </div>
            ))}
          </div>
        </div>
      </PopoverList>
    </div>
  )
}
