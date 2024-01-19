import {ReactNode, createContext} from 'react'
import {PortableTextMarker} from '../../../types'

export const PortableTextMarkersContext = createContext<PortableTextMarker[]>([])

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
