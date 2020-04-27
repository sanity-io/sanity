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

function PresenceContainer({presence, position, avatarComponent: AvatarComponent}: ContainerProps) {
  const [hiddenUsers, visibleUsers] = splitRight(presence || [])

  return (
    <div className={styles.root}>
      <PopoverList
        trigger="click"
        userList={presence}
        hiddenCount={hiddenUsers.length}
        disabled={hiddenUsers.length <= 1}
        withStack={hiddenUsers.length >= MAX_AVATARS - 1}
      >
        {visibleUsers.map(user => (
          <div key={user.sessionId} style={{display: 'flex', marginLeft: '-8px'}}>
            <AvatarComponent
              position={position}
              userId={user.identity}
              sessionId={user.sessionId}
            />
          </div>
        ))}
      </PopoverList>
    </div>
  )
}
