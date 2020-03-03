import React from 'react'
import {PresenceMarker} from './PresenceMarker'

export function PresenceMarkerList(props) {
  return (
    <span style={{position: 'absolute', top: 0, right: 20}}>
      {props.presence.map(marker => (
        <PresenceMarker marker={marker} />
      ))}
    </span>
  )
}
