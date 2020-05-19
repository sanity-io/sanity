import {Marker} from '../../typedefs'
import {PortableTextBlock} from '@sanity/portable-text-editor'
export type RenderCustomMarkers = (arg0: Marker[]) => JSX.Element
export type RenderBlockActions = (arg0: {
  block: PortableTextBlock
  value: PortableTextBlock[] | undefined
  set: (arg0: PortableTextBlock) => void
  unset: () => void
  insert: (arg0: PortableTextBlock | PortableTextBlock[]) => void
}) => JSX.Element
