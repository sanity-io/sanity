import {type ReactNode} from 'react'
import {type PortableTextMarker, PortableTextMarkersContext} from 'sanity/_singleton'

export function PortableTextMarkersProvider(props: {
  markers: PortableTextMarker[]
  children: ReactNode
}) {
  return (
    <PortableTextMarkersContext.Provider value={props.markers}>
      {props.children}
    </PortableTextMarkersContext.Provider>
  )
}
