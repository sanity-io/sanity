import {type Path} from '@sanity/types'
import {isEqual} from '@sanity/util/paths'
import {useContext, useMemo} from 'react'
import {PortableTextMarkersContext} from 'sanity/_singletons'

import {type PortableTextMarker} from '../../../types'

export function usePortableTextMarkers(path: Path): PortableTextMarker[] {
  const ctx = useContext(PortableTextMarkersContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  const markers = useMemo(() => ctx.filter((m) => isEqual(m.path, path)), [ctx, path])
  return markers
}
