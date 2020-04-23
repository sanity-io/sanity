import React, {useState} from 'react'
import UsersIcon from 'part:@sanity/base/users-icon'
import useCollaborators from 'part:@sanity/base/hooks/collaborators'
import styles from './GlobalStatus.css'
import PopoverList from './PopoverList'

export default function GlobalStatus() {
  const [isOpen, setIsOpen] = useState(false)
  const users = useCollaborators()

  const handlePresenceMenuToggle = () => setIsOpen(!isOpen)

  return (
    <div className={styles.root}>
      <button
        className={`${styles.button} ${isOpen ? styles.isOpen : ''}`}
        onClick={handlePresenceMenuToggle}
        title="Show users"
        type="button"
      >
        <div className={styles.icon}>
          {users.length > 0 && (
            <div className={styles.statusIndicator} aria-label={`Online collaborators`} />
          )}
          <UsersIcon />
        </div>
      </button>
      {isOpen && (
        <PopoverList
          users={users}
          avatarSize="medium"
          withStack={false}
          onClickOutside={handlePresenceMenuToggle}
        />
      )}
    </div>
  )
}
