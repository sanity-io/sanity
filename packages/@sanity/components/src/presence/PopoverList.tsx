/* eslint-disable react/no-multi-comp */
import React from 'react'
import styles from './PopoverList.css'
import ListItem from './ListItem'
import {User, Size} from './types'
import {Tooltip} from 'react-tippy'
import Avatar from './Avatar'

type Props = {
  users: User[]
  avatarSize?: Size
  position?: 'top' | 'bottom'
  withStack?: boolean
  trigger?: 'mouseenter' | 'click'
  children?: any
  distance?: number
  disabled?: boolean
}

export default function PopoverList({
  users,
  position = 'bottom',
  distance = 16,
  avatarSize,
  withStack = true,
  trigger = 'mouseenter',
  children,
  disabled = false
}: Props) {
  const html = (
    <ul className={styles.list}>
      {users.length > 0 ? (
        users.map(user => (
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
        <li className={styles.empty}>Looks like it's just you...</li>
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
      animation="scale"
      arrow
      theme="light"
      distance={distance}
      duration={50}
    >
      {withStack && (
        <Avatar label="" position={position} color="grey">
          +{users.length}
        </Avatar>
      )}
      {children && children}
    </Tooltip>
  )
}
