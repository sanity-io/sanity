import React from 'react'
import styles from './styles/PresenceContainer.css'
import Avatar from './Avatar'
import {Box} from '@sanity/overlayer'

export default function PresenceContainer({presence}) {
  return (
    <div className={styles.root}>
      {presence &&
        presence.map(item => (
          <Box style={{display: 'inline-block'}} id={item.identity}>
            <Avatar key={item.identity} id={item.identity} />
          </Box>
        ))}
    </div>
  )
}
