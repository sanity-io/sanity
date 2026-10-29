import {type ReactNode} from 'react'
import {PortableTextMarkersContext} from 'sanity/_singletons'

import {type PortableTextMarker} from '../../../types/_transitional'

export function PortableTextMarkersProvider(props: {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  markers: PortableTextMarker[]
  children: ReactNode
}) {
  return (
    <PortableTextMarkersContext.Provider value={props.markers}>
      {props.children}
    </PortableTextMarkersContext.Provider>
  )
}
