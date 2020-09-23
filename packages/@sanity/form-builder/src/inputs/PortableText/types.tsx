import {PortableTextBlock} from '@sanity/portable-text-editor'
import {Path, Marker} from '@sanity/types'

export type ObjectEditData = {
  editorPath: Path // The object representation in the editor (i.e. an text for an annotation)
  formBuilderPath: Path // The actual data storage path in the PT model (like .markDefs for annotations)
  kind: 'annotation' | 'blockObject' | 'inlineObject'
}

export type RenderCustomMarkers = (markers: Marker[]) => JSX.Element

export type RenderBlockActions = (actions: {
  block: PortableTextBlock
  value: PortableTextBlock[] | undefined
  set: (block: PortableTextBlock) => void
  unset: () => void
  insert: (block: PortableTextBlock | PortableTextBlock[]) => void
}) => JSX.Element
