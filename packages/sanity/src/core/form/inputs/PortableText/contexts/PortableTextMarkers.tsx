import {type PortableTextMarker} from '../../../types'
import {type ReactNode} from 'react'
import {PortableTextMarkersContext} from 'sanity/_singletons'

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
