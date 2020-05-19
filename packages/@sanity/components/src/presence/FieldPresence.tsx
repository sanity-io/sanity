/* eslint-disable @typescript-eslint/no-use-before-define,react/no-multi-comp */
import React from 'react'
import {splitRight} from './utils'
import {sortBy, uniqBy} from 'lodash'
import {AVATAR_DISTANCE, AVATAR_SIZE, MAX_AVATARS} from './constants'
import {PopoverList, StackCounter} from './index'
import styles from './FieldPresence.css'
import UserAvatar from './UserAvatar'
import {PresenceRegion} from './overlay/PresenceRegion'
import {FieldPresence as FieldPresenceT, Position} from './types'
import {PresenceListItem} from './PresenceListItem'

interface Props {
  presence: FieldPresenceT[]
}

export function FieldPresence({presence}: Props) {
  return presence.length > 0 ? (
    <PresenceRegion presence={presence} component={FieldPresenceInner} />
  ) : null
}

interface InnerProps {
  presence: FieldPresenceT[]
  position: Position
}

export function FieldPresenceInner({presence, position}: InnerProps) {
  const sorted = sortBy(
    uniqBy(presence || [], item => item.user.id),
    presence => presence.lastActiveAt
  )
  const [hidden, visible] = splitRight(sorted, MAX_AVATARS)

  const avatars = [
    ...visible.reverse().map(visible => ({
      key: visible.user.id,
      element: <UserAvatar position={position} user={visible.user} />
    })),
    hidden.length >= 2
      ? {
          key: 'counter',
          element: <StackCounter count={hidden.length} />
        }
      : null
  ].filter(Boolean)

  const minWidth = -AVATAR_DISTANCE + (AVATAR_SIZE + AVATAR_DISTANCE) * MAX_AVATARS
  return (
    <div className={styles.root}>
      <PopoverList
        items={presence}
        position="top-end"
        trigger="mouseenter"
        distance={10}
        renderItem={item => <PresenceListItem status="online" user={item.user} />}
      >
        <div className={styles.inner} style={{minWidth}}>
          {avatars.map((av, i) => (
            <div
              key={av.key}
              style={{
                position: 'absolute',
                transform: `translate3d(${-i * (AVATAR_SIZE + AVATAR_DISTANCE)}px, 0px, 0px)`,
                transitionProperty: 'transform',
                transitionDuration: '200ms',
                transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
                zIndex: 100 - i
              }}
            >
              {av.element}
            </div>
          ))}
        </div>
      </PopoverList>
    </div>
  )
}
