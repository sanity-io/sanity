import React from 'react'
import {
  ObjectSchemaType,
  Path,
  PortableTextObject,
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderCustomMarkers,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from 'sanity'

interface AnnotationProps {
  children: React.ReactElement
  editorNodeFocused: boolean
  floatingBoundary: HTMLElement | null
  focused: boolean
  onItemClose: () => void
  onItemOpen: (path: Path) => void
  onPathFocus: (path: Path) => void
  path: Path
  readOnly?: boolean
  referenceBoundary: HTMLElement | null
  referenceElement: HTMLElement | null
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderCustomMarkers?: RenderCustomMarkers
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  selected: boolean
  schemaType: ObjectSchemaType
  value: PortableTextObject
}

export default function Annotation(props: AnnotationProps) {
  const {children} = props
  return children
}
