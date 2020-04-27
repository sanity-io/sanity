/* eslint-disable react/no-multi-comp */
import React from 'react'
import styles from './PopoverList.css'
import ListItem from './ListItem'
import {User, Size, Position} from './types'
import {Tooltip} from 'react-tippy'

type Props = {
  userList: User[]
  hiddenCount?: number
  avatarSize?: Size
  position?: 'top' | 'bottom'
  arrowPosition?: Position
  withStack?: boolean
  trigger?: 'mouseenter' | 'click'
  children?: any
  distance?: number
  disabled?: boolean
}

export default function PopoverList({
  userList = [],
  hiddenCount,
  position = 'top',
  distance = 10,
  avatarSize,
  withStack = true,
  trigger = 'mouseenter',
  children,
  disabled = false,
  arrowPosition
}: Props) {
  const html = (
    <ul className={styles.list}>
      {userList.length > 0 ? (
        userList.map(user => (
          <li key={user.identity}>
            <ListItem
              id={user.identity}
              status={user.status}
              sessions={user?.sessions}
              size={avatarSize}
            />
          </li>
        ))
      ) : (
        <li className={styles.empty}>{/* TODO: see slack messages from marius */}</li>
      )}
    </ul>
  )
  return (
    <Tooltip
      html={html}
      disabled={disabled}
      interactive
      position={position}
      trigger={trigger}
      arrow
      theme="light"
      distance={distance}
    >
      <div className={styles.root}>
        {withStack && hiddenCount && (
          <div data-position={arrowPosition} className={styles.avatarCounter}>
            {hiddenCount}
          </div>
        )}
        {children && children}
      </div>
    </Tooltip>
  )
}
