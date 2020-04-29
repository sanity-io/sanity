/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React from 'react'
import {useId} from '@reach/auto-id'
import styles from './Container.css'
import AvatarProvider from './AvatarProvider'
import {MAX_AVATARS} from './constants'
import {RegionReporter} from '@sanity/overlayer'
import {Presence, Position} from './types'
import PopoverList from './PopoverList'
import {splitRight} from './utils'
import {uniqBy} from 'lodash'
import popoverListStyles from './PopoverList.css'
import Avatar from './Avatar'

type ContainerProps = {
  presence: Presence[]
  position: Position
  avatarComponent: React.ComponentType<{userId: string; sessionId: string; position: Position}>
  children?: React.ReactNode
}

type RegionReporterProps = {
  presence: Presence[]
  position: Position
}

export default function PresenceContainerRegion({presence, position}: RegionReporterProps) {
  const id = useId()

  return (
    <RegionReporter
      id={id}
      data={{presence, position, avatarComponent: AvatarProvider}}
      component={PresenceContainer}
    />
  )
}

const AVATAR_WIDTH = 28

function PresenceContainer({presence, position, avatarComponent: AvatarComponent}: ContainerProps) {
  const [hiddenUsers, visibleUsers] = splitRight(uniqBy(presence || [], Math.random))

  const avatars = [
    ...visibleUsers.map(user => ({
      key: user.sessionId,
      element: (
        <AvatarComponent position={position} userId={user.identity} sessionId={user.sessionId} />
      )
    })),
    hiddenUsers.length >= MAX_AVATARS - 1
      ? {
          key: 'counter',
          element: <div className={popoverListStyles.avatarCounter}>{hiddenUsers.length}</div>
        }
      : null
  ].filter(Boolean)

  return (
    <div className={styles.root}>
      <PopoverList
        trigger="click"
        userList={presence}
        disabled={hiddenUsers.length <= 1}
        withStack={hiddenUsers.length >= MAX_AVATARS - 1}
      >
        <div style={{minWidth: 55}}></div>
        <div className={styles.inner}>
          {avatars.map((av, i) => (
            <div
              key={av.key}
              style={{
                position: 'absolute',
                transform: `translate3d(${-AVATAR_WIDTH + i * -18}px, 0px, 0px)`,
                transitionProperty: 'transform',
                transitionDuration: '200ms',
                transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
                zIndex: -i
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
