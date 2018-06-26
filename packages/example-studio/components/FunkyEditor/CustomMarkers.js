// @flow

import React from 'react'

type Props = {
  markers: {type: string, path: []}
}

export default function renderCustomMarkers(props: Props) {
  const {markers} = props
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
