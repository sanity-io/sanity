import React, {useState} from 'react'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import UsersIcon from 'part:@sanity/base/users-icon'
import useCollaborators from 'part:@sanity/base/hooks/collaborators'
import styles from './styles/PresenceStatus.css'
import PresenceStatusItem from './PresenceStatusItem'

export default function PresenceStatus() {
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
        <PopOverDialog
          useOverlay={false}
          onClickOutside={handlePresenceMenuToggle}
          onEscape={handlePresenceMenuToggle}
          padding="none"
          placement="bottom"
          modifiers={{
            preventOverflow: {
              padding: 16
            }
          }}
        >
          <ul className={styles.presenceList}>
            {users.length > 0 ? (
              users.map(user => (
                <li key={user.identity}>
                  <PresenceStatusItem
                    id={user.identity}
                    status={user.status}
                    sessions={user.sessions}
                  />
                </li>
              ))
            ) : (
              <li className={styles.empty}>Looks like it's just you...</li>
            )}
          </ul>
        </PopOverDialog>
      )}
    </div>
  )
}
