import {PortableTextBlock} from '@sanity/portable-text-editor'
import {Marker} from '../../typedefs'
import {Path} from '../../typedefs/path'

export type ObjectEditData = {
  editorPath: Path // The object representation in the editor (i.e. an text for an annotation)
  formBuilderPath: Path // The actual data storage path in the PT model (like .markDefs for annotations)
  kind: 'annotation' | 'blockObject' | 'inlineObject'
}

export type RenderCustomMarkers = (arg0: Marker[]) => JSX.Element

export type RenderBlockActions = (arg0: {
  block: PortableTextBlock
  value: PortableTextBlock[] | undefined
  set: (arg0: PortableTextBlock) => void
  unset: () => void
  insert: (arg0: PortableTextBlock | PortableTextBlock[]) => void
}) => JSX.Element
