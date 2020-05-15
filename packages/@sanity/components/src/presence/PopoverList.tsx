/* eslint-disable react/no-multi-comp */
import React, {useRef, useState} from 'react'
import styles from './PopoverList.css'
import {Tooltip} from 'react-tippy'
import CogIcon from 'part:@sanity/base/cog-icon'
import {useId} from '@reach/auto-id'
import {User} from './types'

type Props<Item> = {
  items: Item[]
  renderItem: (item: Item) => React.ReactNode
  position?: 'top' | 'bottom'
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
  distance = 10,
  trigger,
  renderItem,
  children,
  disabled = false,
  isGlobal = false,
  projectId
}: Props<Item>) {
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const elementId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleMenu = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsOpen(!isOpen)
    }
  }

  const handleFocus = () => {
    if (menuRef.current) {
      return menuRef.current.focus()
    }
  }

  const handleResetFocus = event => {
    if (buttonRef.current) {
      buttonRef.current.focus()
    }
  }

  const html = (
    <div
      className={styles.inner}
      role="menu"
      id={elementId}
      aria-label="Online users"
      ref={menuRef}
      tabIndex={-1}
    >
      {isGlobal && items.length < 1 && (
        <div className={styles.header}>
          <h2 className={styles.title}>No one's here!</h2>
          <p className={styles.subtitle}>Invite more collaborators to see their online statuses.</p>
        </div>
      )}
      {items.length > 0 && (
        <ul className={styles.userList}>
          {items.map(item => (
            <li key={item.user.id}>{renderItem(item)}</li>
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
            onBlur={handleResetFocus}
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
      >
        <button
          aria-label={isOpen ? 'Close presentUser menu' : 'Open presentUser menu'}
          type="button"
          className={styles.button}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls={elementId}
          onKeyDown={handleToggleMenu}
          ref={buttonRef}
          style={isGlobal ? {height: '100%'} : {}}
        >
          {children}
        </button>
      </Tooltip>
    </div>
  )
}
