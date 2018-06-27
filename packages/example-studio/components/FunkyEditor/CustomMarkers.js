// @flow

import React from 'react'

export default function renderCustomMarkers(markers: {type: string, path: []}[]) {
  return (
    <div>
      {markers.map((marker, index) => {
        if (marker.type === 'customMarkerTest') {
          return <div key={`marker${index}`}>Marker!</div>
        }
        return null
      })}
    </div>
  )
}
