import {PortableTextMarker} from '@sanity/form-builder'
import React from 'react'

export default function renderCustomMarkers(markers: PortableTextMarker[]) {
  return (
    <div>
      {markers.map((marker, index) => {
        if (marker.type === 'customMarkerTest') {
          return <div key={index}>Marker!</div>
        }
        return null
      })}
    </div>
  )
}
