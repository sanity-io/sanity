import nodePath from 'node:path'
import React, {useMemo} from 'react'
import {Card} from '@sanity/ui'
import {usePortableTextEditor} from '@sanity/portable-text-editor'
import {DefaultAnnotationComponent} from '../../../../core/form/inputs/PortableText/object/Annotation'
import {
  BlockAnnotationProps,
  EMPTY_ARRAY,
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
  validation,
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
  const editor = usePortableTextEditor()
  const {
    children,
    editorNodeFocused,
    floatingBoundary,
    focused,
    onItemClose,
    onItemOpen,
    onPathFocus,
    path,
    readOnly,
    referenceBoundary,
    referenceElement,
    renderAnnotation,
    renderBlock,
    renderCustomMarkers,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
    selected,
    value,
  } = props
  const text = useMemo(() => <span data-annotation="">{children}</span>, [children])
  const componentProps = useMemo(
    (): BlockAnnotationProps => ({
      __unstable_floatingBoundary: floatingBoundary,
      __unstable_referenceBoundary: referenceBoundary,
      __unstable_referenceElement: referenceElement,
      __unstable_textElementFocus: editorNodeFocused, // Is there focus on the related text element for this object?
      children: input,
      focused,
      markers: EMPTY_ARRAY,
      onClose,
      onOpen,
      onPathFocus,
      onRemove,
      open: isOpen,
      parentSchemaType: editor.schemaTypes.block,
      path: nodePath,
      presence: EMPTY_ARRAY,
      readOnly: Boolean(readOnly),
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderPreview,
      renderItem,
      renderDefault: DefaultAnnotationComponent,
      schemaType,
      selected,
      textElement: text,
      validation,
      value,
    }),
    [
      editor.schemaTypes.block,
      editorNodeFocused,
      floatingBoundary,
      focused,
      onPathFocus,
      readOnly,
      referenceBoundary,
      referenceElement,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType,
      selected,
      value,
    ],
  )
  return props.children
}
