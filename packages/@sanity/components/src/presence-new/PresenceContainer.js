import React from 'react'
import {useId} from '@reach/auto-id'
import styles from './styles/PresenceContainer.css'
import AvatarProvider from './AvatarProvider'
import Avatar from './Avatar'
import {MAX_AVATARS} from './config'
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

const splitRight = (array, index) => {
  const idx = Math.max(0, array.length - index)
  return [array.slice(0, idx), array.slice(idx)]
}

function PresenceContainer({presence, position}) {
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
