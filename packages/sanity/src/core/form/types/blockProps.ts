import {
  ArraySchemaType,
  BlockDecoratorDefinition,
  BlockListDefinition,
  BlockStyleDefinition,
  FormNodeValidation,
  ObjectSchemaType,
  Path,
  PortableTextBlock,
  PortableTextObject,
  PortableTextTextBlock,
  SchemaType,
} from '@sanity/types'
import {ReactElement, ReactNode} from 'react'
import {FormNodePresence} from '../../presence'
import {PortableTextMarker} from '../..'
import {
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from './renderCallback'

/**
 * @hidden
 * @beta */
export interface BlockDecoratorProps {
  children: React.ReactElement
  focused: boolean
  renderDefault: (props: BlockDecoratorProps) => React.ReactElement
  schemaType: BlockDecoratorDefinition
  selected: boolean
  title: string
  value: string
}

/**
 * @hidden
 * @beta */
export interface BlockStyleProps {
  block: PortableTextTextBlock
  children: React.ReactElement
  focused: boolean
  renderDefault: (props: BlockStyleProps) => React.ReactElement
  schemaType: BlockStyleDefinition
  selected: boolean
  title: string
  value: string
}

/**
 * @hidden
 * @beta */
export interface BlockListItemProps {
  block: PortableTextTextBlock
  children: React.ReactElement
  focused: boolean
  level: number
  renderDefault: (props: BlockListItemProps) => React.ReactElement
  schemaType: BlockListDefinition
  selected: boolean
  title: string
  value: string
}

/**
 * @hidden
 * @beta */
export interface BlockAnnotationProps {
  __unstable_floatingBoundary: HTMLElement | null
  __unstable_referenceBoundary: HTMLElement | null
  __unstable_referenceElement: HTMLElement | null // Reference element representing the annotation in the DOM
  __unstable_textElementFocus?: boolean // Wether the related text element (in the editor) has selection focus. Differs from form state focus.
  children: ReactNode
  focused: boolean // Whether the annotation data object has form focus
  markers: PortableTextMarker[]
  onClose: () => void
  onOpen: () => void
  onPathFocus: (path: Path) => void
  onRemove: () => void
  open: boolean
  parentSchemaType: SchemaType
  path: Path
  presence: FormNodePresence[]
  readOnly: boolean
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderDefault: (props: BlockAnnotationProps) => ReactElement
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean // Whether the object is selected in the editor
  textElement: ReactElement
  validation: FormNodeValidation[]
  value: PortableTextObject
}

/**
 * @hidden
 * @beta */
export interface BlockProps {
  __unstable_floatingBoundary: HTMLElement | null
  __unstable_referenceBoundary: HTMLElement | null
  __unstable_referenceElement: HTMLElement | null // Reference element representing the block in the DOM
  children: ReactNode
  focused: boolean // Whether the object has form focus
  markers: PortableTextMarker[]
  onClose: () => void
  onOpen: () => void
  onPathFocus: (path: Path) => void
  onRemove: () => void
  open: boolean
  parentSchemaType: ArraySchemaType | ObjectSchemaType
  path: Path
  presence: FormNodePresence[]
  readOnly: boolean
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderDefault: (props: BlockProps) => ReactElement
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean // Whether the object is selected in the editor
  validation: FormNodeValidation[]
  value: PortableTextBlock
}
