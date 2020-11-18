/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/require-default-props */

import React, {useContext} from 'react'
import {sortBy, uniqBy} from 'lodash'
import {AvatarCounter, AvatarPosition} from 'part:@sanity/components/avatar'
import {UserAvatar} from '../components/UserAvatar'
import {
  AVATAR_DISTANCE,
  AVATAR_SIZE,
  DEFAULT_MAX_AVATARS_FIELDS,
  DISABLE_OVERLAY,
} from './constants'
import {splitRight} from './utils'
import styles from './FieldPresence.css'
import {useId} from '@reach/auto-id'

import {FormFieldPresenceContext} from './context'
import {PresenceTooltip} from './PresenceTooltip'
import {FormFieldPresence} from './types'
import {useReporter} from './overlay/tracker'

export interface FieldPresenceProps {
  presence: FormFieldPresence[]
  maxAvatars: number
}

function FieldPresenceWithOverlay(props: FieldPresenceProps) {
  const contextPresence = useContext(FormFieldPresenceContext)
  const {presence = contextPresence, maxAvatars = DEFAULT_MAX_AVATARS_FIELDS} = props
  const ref = React.useRef(null)

  useReporter(useId() || '', () => ({presence, element: ref.current!, maxAvatars: maxAvatars}))

  const minWidth = -AVATAR_DISTANCE + (AVATAR_SIZE + AVATAR_DISTANCE) * props.maxAvatars
  return (
    <div ref={ref} className={styles.root} style={{minWidth: minWidth, minHeight: AVATAR_SIZE}} />
  )
}

function FieldPresenceWithoutOverlay(props: FieldPresenceProps) {
  const contextPresence = useContext(FormFieldPresenceContext)
  const {presence = contextPresence, maxAvatars = DEFAULT_MAX_AVATARS_FIELDS} = props
  return presence.length > 0 ? (
    <FieldPresenceInner presence={presence} maxAvatars={maxAvatars} />
  ) : null
}

export const FieldPresence = DISABLE_OVERLAY
  ? FieldPresenceWithoutOverlay
  : FieldPresenceWithOverlay

interface InnerProps {
  maxAvatars?: number
  presence: FormFieldPresence[]
  stack?: boolean
  position?: AvatarPosition
  animateArrowFrom?: AvatarPosition
}

function calcAvatarStackWidth(len: number) {
  return -AVATAR_DISTANCE + (AVATAR_SIZE + AVATAR_DISTANCE) * len
}

export function FieldPresenceInner({
  presence,
  position = 'inside',
  animateArrowFrom = 'inside',
  maxAvatars = DEFAULT_MAX_AVATARS_FIELDS,
  stack = true,
}: InnerProps) {
  const uniquePresence = uniqBy(presence || [], (item) => item.user.id)
  const sorted = sortBy(uniquePresence, (_presence) => _presence.lastActiveAt)
  const [hidden, visible] = stack ? splitRight(sorted, maxAvatars) : [[], sorted]

  const avatars = [
    ...visible.reverse().map((_visible) => ({
      key: _visible.user.id,
      element: (
        <UserAvatar
          animateArrowFrom={animateArrowFrom}
          position={position}
          status="online"
          user={_visible.user}
        />
      ),
    })),
    hidden.length >= 2
      ? {
          key: 'counter',
          element: <AvatarCounter count={hidden.length} />,
        }
      : null,
  ].filter(Boolean)

  const maxWidth = calcAvatarStackWidth(maxAvatars)
  const currWidth = Math.min(calcAvatarStackWidth(uniquePresence.length), maxWidth)

  return (
    <div className={styles.root} style={{width: maxWidth}}>
      <div />

      <PresenceTooltip items={uniquePresence} placement="top">
        <div className={styles.inner} style={{width: currWidth}}>
          {avatars.map(
            (av, i) =>
              av && (
                <div
                  key={av.key}
                  style={{
                    position: 'absolute',
                    transform: `translate3d(${-i * (AVATAR_SIZE + AVATAR_DISTANCE)}px, 0px, 0px)`,
                    transitionProperty: 'transform',
                    transitionDuration: '200ms',
                    transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
                    zIndex: 100 - i,
                  }}
                >
                  {av.element}
                </div>
              )
          )}
        </div>
      </PresenceTooltip>
    </div>
  )
}
