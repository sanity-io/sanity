import React, {useState, useEffect} from 'react'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import {clients$} from 'part:@sanity/base/presence'
import UsersIcon from 'part:@sanity/base/users-icon'
import useCollaborators from 'part:@sanity/base/hooks/collaborators'
import styles from './styles/CollaboratorStatus.css'
import CollaboratorList from './CollaboratorList'

export default function CollaboratorStatus() {
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
          <div className={styles.statusIndicator} aria-label={`Online collaborators`} />
          <UsersIcon />
        </div>
      </button>
      {isOpen && (
        <PopOverDialog
          useOverlay={false}
          onClickOutside={handlePresenceMenuToggle}
          onEscape={handlePresenceMenuToggle}
          padding="none"
        >
          <CollaboratorList users={users} />
        </PopOverDialog>
      )}
    </div>
  )
}
