/* eslint-disable @typescript-eslint/no-use-before-define,react/no-multi-comp */
import React, {useContext} from 'react'
import {splitRight} from './utils'
import {sortBy, uniqBy} from 'lodash'
import {
  AVATAR_DISTANCE,
  AVATAR_SIZE,
  DEFAULT_MAX_AVATARS_FIELDS,
  DISABLE_OVERLAY
} from './constants'
import {PopoverList, StackCounter} from './index'
import styles from './FieldPresence.css'
import UserAvatar from './UserAvatar'
import {PresenceRegion} from './overlay/PresenceOverlayRegion'
import {FormFieldPresence, Position} from './types'
import {PresenceListItem} from './PresenceListItem'
import {Context} from './context'

export interface FieldPresenceProps {
  presence: FormFieldPresence[]
  maxAvatars: number
}

function FieldPresencePlaceholder(props: FieldPresenceProps) {
  const minWidth = -AVATAR_DISTANCE + (AVATAR_SIZE + AVATAR_DISTANCE) * props.maxAvatars
  return <div className={styles.root} style={{minWidth: minWidth, minHeight: AVATAR_SIZE}} />
}

function FieldPresenceWithOverlay(props: FieldPresenceProps) {
  const contextPresence = useContext(Context)
  const {presence = contextPresence, maxAvatars = DEFAULT_MAX_AVATARS_FIELDS} = props
  return presence.length > 0 ? (
    <PresenceRegion
      presence={presence}
      maxAvatars={maxAvatars}
      component={FieldPresencePlaceholder}
    />
  ) : null
}

function FieldPresenceWithoutOverlay(props: FieldPresenceProps) {
  const contextPresence = useContext(Context)
  const {presence = contextPresence, maxAvatars = DEFAULT_MAX_AVATARS_FIELDS} = props
  return presence.length > 0 ? (
    <FieldPresenceInner presence={presence} maxAvatars={maxAvatars} />
  ) : null
}

export const FieldPresence = DISABLE_OVERLAY
  ? FieldPresenceWithoutOverlay
  : FieldPresenceWithOverlay

interface InnerProps {
  maxAvatars: number
  presence: FormFieldPresence[]
  stack?: boolean
  position?: Position
  animateArrowFrom?: Position
}

export function FieldPresenceInner({
  presence,
  position = 'inside',
  animateArrowFrom = 'inside',
  maxAvatars = DEFAULT_MAX_AVATARS_FIELDS,
  stack = true
}: InnerProps) {
  const sorted = sortBy(
    uniqBy(presence || [], item => item.user.id),
    presence => presence.lastActiveAt
  )
  const [hidden, visible] = stack ? splitRight(sorted, maxAvatars) : [[], sorted]

  const avatars = [
    ...visible.reverse().map(visible => ({
      key: visible.user.id,
      element: (
        <UserAvatar animateArrowFrom={animateArrowFrom} position={position} user={visible.user} />
      )
    })),
    hidden.length >= 2
      ? {
          key: 'counter',
          element: <StackCounter count={hidden.length} />
        }
      : null
  ].filter(Boolean)
  const minWidth = -AVATAR_DISTANCE + (AVATAR_SIZE + AVATAR_DISTANCE) * maxAvatars
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
