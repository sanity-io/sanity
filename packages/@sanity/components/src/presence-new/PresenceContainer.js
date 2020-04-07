import React from 'react'
import styles from './styles/PresenceContainer.css'
import Avatar from './Avatar'
import AvatarStack from './AvatarStack'

export default function PresenceContainer({presence, position}) {
  return (
    <div className={styles.root}>
      <AvatarStack>
        {presence &&
          presence.map(item => (
            <Avatar
              key={item.sessionId}
              position={position}
              userId={item.identity}
              sessionId={item.sessionId}
            />
          ))}
      </AvatarStack>
    </div>
  )
}
