import React from 'react'
import styles from './styles/PresenceContainer.css'
import Avatar from './Avatar'

export default function PresenceContainer({presence}) {
  return (
    <div
      className={styles.root}
      data-presence-container={presence && presence.map(u => u.identity)}
    >
      {presence && presence.map(item => <Avatar key={item.identity} id={item.identity} />)}
    </div>
  )
}
