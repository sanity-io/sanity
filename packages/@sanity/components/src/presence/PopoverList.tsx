/* eslint-disable react/no-multi-comp */
import React, {useRef, useState} from 'react'
import styles from './PopoverList.css'
import {Tooltip, Position} from 'react-tippy'
import CogIcon from 'part:@sanity/base/cog-icon'
import {useId} from '@reach/auto-id'
import {User} from './types'

type Props<Item> = {
  items: Item[]
  renderItem: (item: Item, onClose?: (event: any) => void) => React.ReactNode
  position?: Position
  trigger?: 'mouseenter' | 'click' | 'manual'
  children?: React.ReactNode
  distance?: number
  disabled?: boolean
  isGlobal?: boolean
  projectId?: string
}

export default function PopoverList<Item extends {user: User}>({
  items = [],
  position = 'top',
  distance = 0,
  trigger,
  renderItem,
  children,
  disabled = false,
  isGlobal = false,
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
          <h2 className={styles.title}>No collaborators here!</h2>
          <p className={styles.subtitle}>Invite more collaborators to see their online statuses.</p>
        </div>
      )}
      {items.length > 0 && (
        <ul className={styles.userList}>
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
            <CogIcon />
          </a>
        </div>
      )}
    </div>
  )
  return (
    <div className={styles.root}>
      <Tooltip
        useContext
        html={html}
        disabled={disabled}
        interactive
        position={position}
        trigger={trigger}
        arrow
        theme="light"
        distance={distance}
        open={isOpen}
        onRequestClose={handleCloseList}
      >
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
      </Tooltip>
    </div>
  )
}
