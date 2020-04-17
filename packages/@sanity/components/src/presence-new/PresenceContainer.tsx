import React from 'react'
import {useId} from '@reach/auto-id'
import styles from './styles/PresenceContainer.css'
import AvatarProvider from './AvatarProvider'
import Avatar from './Avatar'
import {MAX_AVATARS} from './config'
import {RegionReporter} from '@sanity/overlayer'
import {Presence, Position}  from './types'

type ContainerProps = {
  presence: Presence
  position: Position
  children?: React.ReactNode
}

type RegionReporterProps = {
  presence: Presence
}

export default function PresenceContainerBox({presence}: RegionReporterProps) {
  const id = useId()
  return (
    <RegionReporter
      id={id}
      data={{presence, avatarComponent: AvatarProvider}}
      childComponent={PresenceContainer}
    />
  )
}

const splitRight = (array: Array<any>, index: number): Array<any> => {
  const idx = Math.max(0, array.length - index)
  return [array.slice(0, idx), array.slice(idx)]
}

function PresenceContainer({presence, position}: ContainerProps) {
  const [collapsed, avatars] = splitRight(presence || [], MAX_AVATARS)
  return (
    <div className={styles.root}>
      {collapsed.length > 0 && (
        <Avatar
          position={position}
          label={collapsed.map(a => a.displayName).join(', ')}
          color="salmon"
        >
          +{collapsed.length}
        </Avatar>
      )}
      {avatars.map(item => (
        <AvatarProvider
          key={item.sessionId}
          position={position}
          userId={item.identity}
          sessionId={item.sessionId}
        />
      ))}
    </div>
  )
}
