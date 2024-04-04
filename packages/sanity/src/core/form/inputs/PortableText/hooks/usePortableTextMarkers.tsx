import {type Path} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useContext, useMemo} from 'react'
import {type PortableTextMarker, PortableTextMarkersContext} from 'sanity/_singleton'

export function usePortableTextMarkers(path: Path): PortableTextMarker[] {
  const ctx = useContext(PortableTextMarkersContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  const markers = useMemo(() => ctx.filter((m) => isEqual(m.path, path)), [ctx, path])
  return markers
}
