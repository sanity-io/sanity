import {type ReactNode} from 'react'
import {PortableTextMarkersContext} from 'sanity/_singletons'

import {type PortableTextMarker} from '../../../types'

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
