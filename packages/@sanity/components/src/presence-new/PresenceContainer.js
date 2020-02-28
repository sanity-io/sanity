import React from 'react'
import Avatar from './Avatar'

export default function PresenceContainer({presence}) {
  return (
    <div data-presence-container={presence && presence.map(u => u.identity)}>
      {presence && presence.map(item => <Avatar key={item.identity} id={item.identity} />)}
    </div>
  )
}
