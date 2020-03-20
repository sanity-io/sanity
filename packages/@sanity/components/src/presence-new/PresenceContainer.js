import React from 'react'
import styles from './styles/PresenceContainer.css'
import Avatar from './Avatar'
import {Box} from '@sanity/overlayer'

export default function PresenceContainer({presence}) {
  return (
    <div className={styles.root}>
      {presence &&
        presence.map(item => (
          <Box key={item.sessionId} style={{display: 'inline-block'}} id={item.sessionId}>
            <Avatar key={item.identity} id={item.identity} />
          </Box>
        ))}
    </div>
  )
}
