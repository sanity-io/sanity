import {
  BlockDecoratorDefinition,
  BlockListDefinition,
  BlockStyleDefinition,
  Path,
  PortableTextBlock,
  PortableTextObject,
  PortableTextTextBlock,
  SchemaType,
} from '@sanity/types'

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
  children: React.ReactElement
  focused: boolean
  onClose: () => void
  onOpen: () => void
  onRemove: () => void
  open: boolean
  path: Path
  renderDefault: (props: BlockAnnotationProps) => React.ReactElement
  schemaType: SchemaType
  selected: boolean
  value: PortableTextObject
}

/** @beta */
export interface BlockProps {
  __unstable_boundaryElement?: HTMLElement // Boundary element for the annotation, typically a scroll container
  __unstable_referenceElement?: HTMLElement // Reference element representing the block in the DOM
  children: React.ReactElement
  focused: boolean
  onClose: () => void
  onOpen: () => void
  onRemove: () => void
  open: boolean
  path: Path
  renderDefault: (props: BlockProps) => React.ReactElement
  schemaType: SchemaType
  selected: boolean
  value: PortableTextBlock
}
