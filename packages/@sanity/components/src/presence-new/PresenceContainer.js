import React from 'react'
import styles from './styles/PresenceContainer.css'
import AvatarProvider from './AvatarProvider'
import Avatar from './Avatar'
import {useId} from '@reach/auto-id'
import {Box} from '@sanity/overlayer'

export default function PresenceContainerBox(props) {
  const id = useId()
  return (
    <Box
      id={id}
      presence={props.presence}
      avatarComponent={AvatarProvider}
      childComponent={PresenceContainer}
    />
  )
}

const SHOW_MAX = 2

const split = (array, index) => [array.slice(0, index), array.slice(index)]

function PresenceContainer({presence, position}) {
  const [avatars, collapsed] = split(presence || [], SHOW_MAX)
  return (
    <div className={styles.root}>
      {collapsed.length > 0 && (
        <Avatar label={collapsed.map(a => a.displayName).join(', ')} color="salmon">
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
