import {AvatarCounter, type AvatarPosition} from '@sanity/ui'
import {sortBy, uniqBy} from 'lodash'
import {memo, useCallback, useContext, useId, useMemo, useState} from 'react'
import {FormFieldPresenceContext} from 'sanity/_singletons'

import {UserAvatar} from '../components/userAvatar'
import {AVATAR_DISTANCE, AVATAR_SIZE, DEFAULT_MAX_AVATARS_FIELDS} from './constants'
import {FlexWrapper, InnerBox} from './FieldPresence.styled'
import {usePresenceReporter} from './overlay/tracker'
import {PresenceTooltip} from './PresenceTooltip'
import {type FormNodePresence} from './types'
import {splitRight} from './utils'

/** @internal */
export interface FieldPresenceInnerProps {
  maxAvatars?: number
  presence: FormNodePresence[]
  stack?: boolean
  position?: AvatarPosition
  animateArrowFrom?: AvatarPosition
}

/** @internal */
export const FieldPresenceInner = memo(function FieldPresenceInner({
  presence,
  position = 'inside',
  animateArrowFrom = 'inside',
  maxAvatars = DEFAULT_MAX_AVATARS_FIELDS,
  stack = true,
}: FieldPresenceInnerProps) {
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

  return (
    <FlexWrapper>
      <div />

      <InnerBox direction="row-reverse">
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
            ),
        )}
      </InnerBox>
    </FlexWrapper>
  )
})

/** @internal */
export interface FieldPresenceProps {
  presence: FormNodePresence[]
  maxAvatars: number
}

/** @internal */
export function FieldPresence(props: FieldPresenceProps) {
  const contextPresence = useContext(FormFieldPresenceContext)
  const {presence = contextPresence, maxAvatars = DEFAULT_MAX_AVATARS_FIELDS} = props
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  const reporterId = useId()
  const reporterGetSnapshot = useCallback(
    () => ({presence, element, maxAvatars}),
    [element, maxAvatars, presence],
  )
  usePresenceReporter(element ? reporterId : null, reporterGetSnapshot)

  const uniquePresence = useMemo(() => uniqBy(presence || [], (item) => item.user.id), [presence])

  return (
    <PresenceTooltip items={uniquePresence}>
      <FlexWrapper ref={setElement} style={{minHeight: AVATAR_SIZE, minWidth: AVATAR_SIZE}} />
    </PresenceTooltip>
  )
}

/**
 * @internal
 * @hidden
 * @deprecated Use `FieldPresence` instead
 */
export const FieldPresenceWithOverlay = FieldPresence
