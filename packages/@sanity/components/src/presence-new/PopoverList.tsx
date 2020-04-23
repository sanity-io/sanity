/* eslint-disable react/no-multi-comp */
import React from 'react'
import styles from './PopoverList.css'
import ListItem from './ListItem'
import {User} from './types'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import Avatar from './Avatar'

type Props = {
  users: User[]
  avatarSize?: 'small' | 'medium'
  position?: 'top' | 'bottom' | 'inside'
  withStack?: boolean
  onClickOutside?: () => void
}

const isMobile = () => {
  return typeof window !== 'undefined' && window.innerWidth < 512
}

export default function PopoverList({users, position, withStack = true, onClickOutside}: Props) {
  const [showPresenceList, setShowPresenceList] = React.useState(false)

  const handleOpenList = () => {
    setShowPresenceList(true)
  }

  const handleCloseList = () => {
    setShowPresenceList(false)
  }

  const handleClick = () => {
    if (isMobile) {
      setShowPresenceList(!showPresenceList)
    }
  }

  if (!withStack) {
    return <Popover users={users} onClickOutside={onClickOutside} avatarSize="medium" />
  }

  return (
    <div
      style={{position: 'relative'}}
      onMouseEnter={handleOpenList}
      onMouseLeave={handleCloseList}
      onClick={handleClick}
    >
      <Avatar label="" position={position} color="grey">
        +{users.length}
      </Avatar>
      {showPresenceList && <Popover users={users} onClickOutside={handleCloseList} />}
    </div>
  )
}

function Popover({
  users,
  avatarSize = 'small',
  onClickOutside
}: {
  users: User[]
  avatarSize?: 'small' | 'medium'
  onClickOutside: () => void
}) {
  return (
    <PopOverDialog
      useOverlay={false}
      onClickOutside={onClickOutside}
      onEscape={onClickOutside}
      padding="none"
      placement="bottom"
      modifiers={{
        preventOverflow: {
          padding: 16
        }
      }}
    >
      <div className={styles.root}>
        <ul className={styles.list}>
          {users.length > 0 ? (
            users.map(user => (
              <li key={user.identity}>
                <ListItem
                  id={user.identity}
                  status={user.status}
                  sessions={user.sessions}
                  size={avatarSize}
                  onClick={onClickOutside}
                />
              </li>
            ))
          ) : (
            <li className={styles.empty}>Looks like it's just you...</li>
          )}
        </ul>
      </div>
    </PopOverDialog>
  )
}
