/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, {useState} from 'react'
import {useId} from '@reach/auto-id'
import styles from './Container.css'
import AvatarProvider from './AvatarProvider'
import {MAX_AVATARS} from './config'
import {RegionReporter} from '@sanity/overlayer'
import {Presence, Position} from './types'
import PopoverList from './PopoverList'

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

const splitRight = (array: Array<any>, index: number): Array<any> => {
  const idx = Math.max(0, array.length - index)
  return [array.slice(0, idx), array.slice(idx)]
}

function PresenceContainer({presence, position, avatarComponent: AvatarComponent}: ContainerProps) {
  const [collapsedAvatars, avatars] = splitRight(
    /* uniqBy(presence, user => user.identity) */ presence || [],
    MAX_AVATARS
  )

  return (
    <div className={styles.root}>
      <PopoverList
        trigger="click"
        userList={collapsedAvatars}
        avatarSize="small"
        disabled={collapsedAvatars.length < 1}
      >
        {avatars.map(item => (
          <div key={item.sessionId} style={{display: 'flex', marginLeft: '-8px'}}>
            <AvatarComponent
              position={position}
              userId={item.identity}
              sessionId={item.sessionId}
            />
          </div>
        ))}
      </PopoverList>
    </div>
  )
}
