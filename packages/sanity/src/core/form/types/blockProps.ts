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
import {RenderPreviewCallback} from './renderCallback'

/** @beta */
export interface BlockDecoratorProps {
  children: React.ReactElement
  focused: boolean
  renderDefault: (props: BlockDecoratorProps) => React.ReactElement
  schemaType: BlockDecoratorDefinition
  selected: boolean
  title: string
  value: string
}

/** @beta */
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

/** @beta */
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

/** @beta */
export interface BlockAnnotationProps {
  __unstable_boundaryElement?: HTMLElement // Boundary element for the annotation, typically a scroll container
  __unstable_referenceElement?: HTMLElement // Reference element representing the annotation in the DOM
  __unstable_textElementFocus?: boolean // Wether the related text element (in the editor) has selection focus. Differs from form state focus.
  children?: ReactNode | undefined
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
  renderDefault: (props: BlockAnnotationProps) => React.ReactElement
  schemaType: ObjectSchemaType
  selected: boolean // Whether the object is selected in the editor
  textElement: ReactElement
  validation: FormNodeValidation[]
  value: PortableTextObject
}

/** @beta */
export interface BlockProps {
  __unstable_boundaryElement?: HTMLElement // Boundary element for the block, typically a scroll container
  __unstable_referenceElement?: HTMLElement // Reference element representing the block in the DOM
  children?: ReactNode | undefined
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
  renderDefault: (props: BlockProps) => React.ReactElement
  renderPreview: RenderPreviewCallback
  schemaType: ObjectSchemaType
  selected: boolean // Whether the object is selected in the editor
  validation: FormNodeValidation[]
  value: PortableTextBlock
}
