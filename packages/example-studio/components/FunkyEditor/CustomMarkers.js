import React from 'react'

import styles from './CustomMarkers.css'

export default function renderCustomMarkers(markers) {
  return (
    <div className={styles.root}>
      {markers.map((marker, index) => {
        if (marker.type === 'customMarkerTest') {
          return <div key={`marker${index}`}>Marker!</div>
        }
        return null
      })}
    </div>
  )
}
