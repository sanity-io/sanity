/* eslint-disable react/no-multi-comp */
import React, {useState} from 'react'
import {Popover} from 'part:@sanity/components/popover'
import {Tooltip} from 'part:@sanity/components/tooltip'
import CogIcon from 'part:@sanity/base/cog-icon'
import {useId} from '@reach/auto-id'
import styles from './PopoverList.css'
import {User} from './types'

type Props<Item> = {
  items: Item[]
  renderItem: (item: Item, onClose?: (event: any) => void) => React.ReactNode
  placement?: string
  children?: React.ReactNode
  disabled?: boolean
  isGlobal?: boolean
  mode?: 'tooltip'
  projectId?: string
}

// eslint-disable-next-line complexity
export default function PopoverList<Item extends {user: User}>({
  items = [],
  placement = 'bottom-end',
  renderItem,
  children,
  disabled = false,
  isGlobal = false,
  mode,
  projectId
}: Props<Item>) {
  const elementId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleList = event => {
    if (event.key === 'Enter' || event.key === ' ' || event.button === 0) {
      return setIsOpen(!isOpen)
    }
  }

  const handleCloseList = () => {
    setIsOpen(false)
  }

  const html = (
    <div
      className={styles.inner}
      role="menu"
      id={elementId}
      aria-label="Online users"
      tabIndex={-1}
    >
      {isGlobal && items.length < 1 && (
        <div className={styles.header}>
          <h2 className={styles.title}>No one else is here</h2>
          <p className={styles.subtitle}>
            Invite people to your project to see their online status.
          </p>
        </div>
      )}
      {items.length > 0 && (
        <ul className={`${styles.userList} ${isGlobal ? styles.globalUserList : ''}`}>
          {items.map(item => (
            <li key={item.user.id}>{renderItem(item, handleCloseList)}</li>
          ))}
        </ul>
      )}
      {isGlobal && projectId && (
        <div className={styles.manageMembers}>
          <a
            href={`https://manage.sanity.io/projects/${projectId}/team`}
            className={styles.manageLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCloseList}
          >
            <span>Manage members</span>
            <span className={styles.manageIconContainer}>
              <CogIcon />
            </span>
          </a>
        </div>
      )}
    </div>
  )

  const popoverChildren = (
    <div>
      <button
        aria-label={isOpen ? 'Hide online collaborators' : 'Show online collaborators'}
        type="button"
        className={isGlobal ? styles.globalButton : styles.button}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={elementId}
        onKeyDown={handleToggleList}
        onClick={handleToggleList}
        style={isGlobal ? {height: '100%'} : {}}
      >
        {children}
      </button>
    </div>
  )

  if (mode === 'tooltip') {
    return (
      <div className={styles.root}>
        <Tooltip content={html} disabled={disabled} placement={placement}>
          {popoverChildren}
        </Tooltip>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <Popover content={html} disabled={disabled} placement={placement} open={isOpen}>
        {popoverChildren}
      </Popover>
    </div>
  )
}
