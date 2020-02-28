import React from 'react'
import Avatar from './Avatar'

export default function PresenceContainer({presence}) {
  return (
    <div data-presence-container={presence && presence.map(u => u.id)}>
      {presence && presence.map(user => <Avatar key={user.id} id={user.id} />)}
    </div>
  )
}
